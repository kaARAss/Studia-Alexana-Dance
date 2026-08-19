'use client';

import { useEffect, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { brands, colors } from '@/lib/data';

// ─── Shuffle helpers ─────────────────────────────────────────────────────────
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

function shuffleNoAdjacentSrc(array) {
    const arr = shuffleArray([...array]);
    for (let i = 1; i < arr.length; i++) {
        if (arr[i].src === arr[i - 1].src) {
            for (let j = i + 1; j < arr.length; j++) {
                if (arr[j].src !== arr[i - 1].src) { [arr[i], arr[j]] = [arr[j], arr[i]]; break; }
            }
        }
    }
    if (arr[arr.length - 1].src === arr[0].src) {
        for (let j = 1; j < arr.length - 1; j++) {
            if (arr[j].src !== arr[0].src && arr[j].src !== arr[arr.length - 2].src) {
                [arr[arr.length - 1], arr[j]] = [arr[j], arr[arr.length - 1]]; break;
            }
        }
    }
    return arr;
}

function assignColorsNoAdjacent(count, colorPool) {
    const result = [];
    for (let i = 0; i < count; i++) {
        const prev = i > 0 ? result[i - 1] : null;
        const seamColor = i === count - 1 ? result[0] : null;
        const available = colorPool.filter(c => c !== prev && c !== seamColor);
        const pool = available.length > 0 ? available : colorPool.filter(c => c !== prev);
        result.push(pool[Math.floor(Math.random() * pool.length)]);
    }
    return result;
}

function buildMarqueeItems(isMobile) {
    const tracks = [[], []];
    for (let t = 0; t < 2; t++) {
        const shuffledBrands = shuffleNoAdjacentSrc(brands);
        const assignedColors = assignColorsNoAdjacent(shuffledBrands.length, colors);
        const items = shuffledBrands.map((brand, i) => ({ brand, color: assignedColors[i] }));
        // Дубль нужен и на телефоне: без него бегущая строка не замыкается
        tracks[t] = [...items, ...items];
    }
    return tracks;
}

export default function DoubleMarquee() {
    const [tracks, setTracks] = useState([[], []]);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        gsap.registerPlugin(ScrollTrigger);

        const mobile = window.matchMedia('(max-width: 768px)').matches;
        setIsMobile(mobile);
        setTracks(buildMarqueeItems(mobile));

        // Arrow path animation
        gsap.set('.marquee-left .marquee-svg-item:nth-child(2) path', { strokeDashoffset: 1000 });

        const marqueeTl = gsap.timeline({
            scrollTrigger: {
                trigger: '.Double-marquee',
                start: 'top 70%',
                toggleActions: 'play none none reverse' // Allow replaying on scroll out/in
            }
        });

        marqueeTl
            .to('.marquee-underline', { scaleX: 1, opacity: 1, duration: 1, ease: 'power2.out' })
            .to('.marquee-left .marquee-svg-item:nth-child(1)', { scale: 1, opacity: 1, rotation: -10, duration: 0.6, ease: 'back.out(1.7)' }, '-=0.5')
            .to('.marquee-left .marquee-svg-item:nth-child(2) path', { strokeDashoffset: 0, duration: 1.5, ease: 'power2.out' }, '-=0.3');

        return () => {
            ScrollTrigger.getAll().forEach(t => { if (t.vars.trigger === '.Double-marquee') t.kill(); });
        };
    }, []);

    // ─── Телефон: две бесконечные ленты в противоположные стороны ───
    useEffect(() => {
        if (!isMobile) return;
        if (!tracks[0] || tracks[0].length === 0) return;

        const right = document.querySelector('.marquee-right');
        if (!right) return;

        Object.assign(right.style, {
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            // Ленты упираются в края экрана, выходя за отступы блока
            position: 'relative',
            left: '50%',
            marginLeft: '-50vw',
            width: '100vw',
            maxWidth: '100vw',
            height: 'auto',
            overflow: 'hidden',
            padding: '20px 0 32px',
            marginRight: '0',
        });

        const tweens = [];
        const columns = Array.from(right.querySelectorAll('.marquee-column'));

        columns.forEach((column, index) => {
            Object.assign(column.style, {
                display: 'block',
                position: 'relative',
                width: '100%',
                height: '118px',
                flex: 'none',
                overflow: 'hidden',
                animation: 'none',
            });

            const track = column.querySelector('.marquee-track');
            if (!track) return;

            Object.assign(track.style, {
                display: 'flex',
                flexDirection: 'row',
                flexWrap: 'nowrap',
                gap: '0',
                width: 'max-content',
                height: '118px',
                animation: 'none',
                willChange: 'transform',
            });

            Array.from(track.querySelectorAll('.marquee-item')).forEach((item) => {
                Object.assign(item.style, {
                    width: '118px',
                    height: '118px',
                    flex: '0 0 118px',
                    margin: '0 8px 0 0',
                });
            });

            const toLeft = index === 0;
            gsap.set(track, { xPercent: toLeft ? 0 : -50 });
            tweens.push(gsap.to(track, {
                xPercent: toLeft ? -50 : 0,
                duration: 30,
                ease: 'none',
                repeat: -1,
            }));
        });

        return () => { tweens.forEach((t) => t.kill()); };
    }, [isMobile, tracks]);

    // ─── ПК: появление фото в рамке ───
    useEffect(() => {
        if (isMobile) return;
        const photo = document.querySelector('.marquee-photo');
        if (!photo) return;

        const tween = gsap.fromTo(
            photo,
            { opacity: 0, scale: 0.9, y: 60 },
            {
                opacity: 1,
                scale: 1,
                y: 0,
                duration: 1,
                ease: 'power3.out',
                scrollTrigger: {
                    trigger: photo,
                    start: 'top 85%',
                    once: true,
                },
            }
        );

        return () => {
            if (tween.scrollTrigger) tween.scrollTrigger.kill();
            tween.kill();
        };
    }, [isMobile]);

    return (
        <>
            {/* Left: Text + Blob */}
            <div className="marquee-left">
                <div className="marquee-text-container">
                    <h2>с нами<br />танцуют <span className="text-with">уже:</span></h2>
                    <svg xmlns="http://www.w3.org/2000/svg" className="marquee-underline" viewBox="0 0 132 5" fill="none">
                        <path d="M1 2.08377C44.3458 3.90451 87.9791 5.71442 131 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </div>
                <div className="marquee-blob-container">
                    <img src="/assets/Marquee-blob SVG/marquee-blob.svg" className="marquee-blob" alt="" aria-hidden="true" />
                    <div className="marquee-svg-container">
                        <div className="marquee-svg-item">
                            <img src="/assets/Marquee-blob SVG/marquee-hand.svg" width="100%" alt="" aria-hidden="true" />
                        </div>
                        <div className="marquee-svg-item">
                            <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 386 127" fill="none">
                                <path d="M2 123C9 35.9999 84.5 17 124 25.9999C217.764 47.3635 207 115 177.5 123C105.777 142.45 110.737 1.99991 232.5 2C310.5 2.00006 366.5 79 376 118L356.5 105.5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M2 123C9 35.9999 84.5 17 124 25.9999C217.764 47.3635 207 115 177.5 123C105.777 142.45 110.737 1.99991 232.5 2C310.5 2.00006 366.5 79 376 118L384 97" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>

            {/* Фото в рамке закрывает пустоту между текстом и лентами */}
            <div
                className="marquee-photo"
                aria-hidden="true"
                style={{
                    flex: '0 0 auto',
                    width: 'min(42vw, 660px)',
                    alignSelf: 'center',
                    margin: '0 auto',
                    padding: '10px',
                    borderRadius: '30px',
                    border: '4px solid var(--color-dark, #1a1a1a)',
                    backgroundColor: 'var(--color-lightgreen, #e6fab9)',
                    boxShadow: '14px 14px 0 rgba(26, 26, 26, 0.16)',
                    lineHeight: 0,
                    pointerEvents: 'none',
                    zIndex: 4,
                }}
            >
                <img
                    src="https://cdn.prod.website-files.com/683703490bc01e1b8c052e06/686b8e614494dac669a4099c_c310914b5a1a573b4c7499e9531f8d52_DE.avif"
                    alt=""
                    loading="lazy"
                    style={{
                        display: 'block',
                        width: '100%',
                        height: 'auto',
                        aspectRatio: '4 / 5.3',
                        objectFit: 'cover',
                        borderRadius: '22px',
                    }}
                />
            </div>

            {/* Right: Two scrolling columns */}
            <div className="marquee-right">
                {tracks.map((trackItems, colIndex) => (
                    <div key={colIndex} className="marquee-column">
                        <div className="marquee-track">
                            {trackItems.map((item, i) => (
                                <div key={i} className="marquee-item" data-brand={item.brand.name} style={{ backgroundColor: item.color }}>
                                    <div className="marquee-logo">
                                        <div className="marquee-logo__before"></div>
                                        <img src={item.brand.src} loading="lazy" alt={item.brand.name} className="cover-image" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </>
    );
}
