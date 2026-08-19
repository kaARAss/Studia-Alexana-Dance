'use client';

import { useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { CARDS_DATA } from '@/lib/data';

// Горизонтальные позиции карточек: равный шаг 265px при ширине 320px,
// чтобы все перекрытия были одинаковыми и текст не срезался.
// Три карточки, отцентрованные относительно середины экрана без смещения.
const CARD_LEFT = [
    'calc(50% - 425px)',
    'calc(50% - 160px)',
    'calc(50% + 105px)'
];

export default function ServiceCards() {
    useEffect(() => {
        gsap.registerPlugin(ScrollTrigger);

        // Animate underline SVG paths on scroll (from HeroSection)
        gsap.to('.title-underline-svg path', {
            strokeDashoffset: 0,
            duration: 1.2,
            ease: 'power3.out',
            stagger: 0.3,
            scrollTrigger: {
                trigger: '.service-cards-wrapper',
                start: 'top 70%',
                toggleActions: 'play none none reverse'
            }
        });

        initCardAnimations();
    }, []);

    return (
        <>
            {/* ─── Заголовок ─── */}
            <div className="title-container">
                <h2 className="main-title">приходи, если <span className="italic-text">хочешь:</span></h2>
                <svg xmlns="http://www.w3.org/2000/svg" width="160" viewBox="0 0 159 17" fill="none" className="title-underline-svg">
                    <path d="M1 12.1515C53.0771 5.7187 105.529 2.30552 158 1.93652" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
                    <path d="M30.2672 15.9461C64.1899 12.8158 98.2663 11.3583 132.33 11.5735" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
                </svg>
            </div>

            {/* ─── Service Cards ─── */}
            <div className="cards-wrapper" id="cards-wrapper" style={{ margin: "100px auto" }}>
                {CARDS_DATA.map((card, index) => (
                    <div key={card.color} className={`card card-${card.color}`} style={{ left: CARD_LEFT[index] }}>
                        <div className={`card-sticker sticker-${card.sticker}`}>
                            <img
                                src={`/assets/Card-Sticker SVG/sticker-${card.sticker}.svg`}
                                alt=""
                                width="100%"
                                loading="lazy"
                                aria-hidden="true"
                            />
                        </div>
                        <h3 className="card-title">{card.title}</h3>
                        <svg width="100%" height="10" className="card-divider-svg" aria-hidden="true">
                            <use href="#card-divider" />
                        </svg>
                        <ul className="card-list">
                            {card.services.map((service) => (
                                <li key={service}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="16" className="services-card__bullet-svg" aria-hidden="true">
                                        <use href="#bullet-icon" />
                                    </svg>
                                    {service}
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>
        </>
    );
}

function initCardAnimations() {
    const cards = gsap.utils.toArray('.card');
    if (!cards.length) return;

    const originalData = [
        { rotation: 4 },
        { rotation: -5 },
        { rotation: 5 },
        { rotation: -8 },
        { rotation: 5 }
    ];

    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    let leaveTimeout = null;

    if (!isMobile) {
        cards.forEach((card, index) => {
            card.addEventListener('mouseenter', () => {
                if (leaveTimeout) { clearTimeout(leaveTimeout); leaveTimeout = null; }
                const hoverGap = 120;
                const clusterGap = 150;
                const cardWidth = 320;
                const hoveredLeft = cards[index].offsetLeft;
                const leftCards = [];
                const rightCards = [];

                cards.forEach((otherCard, otherIndex) => {
                    if (otherIndex < index) leftCards.push({ card: otherCard, index: otherIndex });
                    else if (otherIndex > index) rightCards.push({ card: otherCard, index: otherIndex });
                });

                const currentTop = cards[index].offsetTop;
                const targetCommonTop = 50;
                const moveY = targetCommonTop - currentTop;

                gsap.to(cards[index], { x: 0, y: moveY, rotation: 0, scale: 1.08, duration: 0.9, ease: 'elastic.out(1, 0.5)', overwrite: true });

                if (rightCards.length) {
                    const clusterStart = hoveredLeft + cardWidth + hoverGap;
                    rightCards.forEach((item, i) => {
                        const targetAbsLeft = clusterStart + (i * clusterGap);
                        const targetX = Math.max(targetAbsLeft - item.card.offsetLeft, 10);
                        const angleRad = originalData[item.index].rotation * (Math.PI / 180);
                        const targetY = targetX * Math.tan(angleRad);
                        gsap.to(item.card, { x: targetX, y: targetY, rotation: originalData[item.index].rotation, scale: 1, duration: 1.0, ease: 'elastic.out(1, 0.5)', overwrite: true });
                    });
                }

                if (leftCards.length) {
                    leftCards.reverse();
                    const clusterStart = hoveredLeft - hoverGap - cardWidth;
                    leftCards.forEach((item, i) => {
                        const targetAbsLeft = clusterStart - (i * clusterGap);
                        const targetX = Math.min(targetAbsLeft - item.card.offsetLeft, -10);
                        const angleRad = originalData[item.index].rotation * (Math.PI / 180);
                        const targetY = targetX * Math.tan(angleRad);
                        gsap.to(item.card, { x: targetX, y: targetY, rotation: originalData[item.index].rotation, scale: 1, duration: 1.0, ease: 'elastic.out(1, 0.5)', overwrite: true });
                    });
                }
            });

            card.addEventListener('mouseleave', () => {
                leaveTimeout = setTimeout(() => {
                    cards.forEach((c, i) => {
                        gsap.to(c, { x: 0, y: 0, scale: 1, rotation: originalData[i].rotation, duration: 1.0, ease: 'elastic.out(1, 0.5)', overwrite: true, zIndex: i + 1 });
                    });
                }, 80);
            });
        });
    } else {
        // ─── Телефон: без пина — обычный вертикальный список ───
        const cardsWrapper = document.querySelector('.cards-wrapper');
        if (cardsWrapper) cardsWrapper.classList.add('cards-mobile-static');
        const mobileRotations = [-3, 2, -2, 3, -2];

        cards.forEach((card, i) => {
            gsap.set(card, { clearProps: 'all' });
            const rot = mobileRotations[i % mobileRotations.length];

            // ─── Появление при прокрутке ───
            gsap.fromTo(card,
                { y: 70, opacity: 0, scale: 0.9, rotation: rot * 2.2 },
                {
                    y: 0,
                    opacity: 1,
                    scale: 1,
                    rotation: rot,
                    duration: 0.85,
                    ease: 'back.out(1.4)',
                    scrollTrigger: {
                        trigger: card,
                        start: 'top 88%',
                        invalidateOnRefresh: true,
                        toggleActions: 'play none none none'
                    }
                }
            );

            // ─── Живое покачивание содержимого в такт прокрутке ───
            const inner = Array.from(card.children);
            if (inner.length) {
                gsap.fromTo(inner,
                    { y: 16 },
                    {
                        y: -16,
                        ease: 'none',
                        scrollTrigger: {
                            trigger: card,
                            start: 'top bottom',
                            end: 'bottom top',
                            scrub: 0.7
                        }
                    }
                );
            }

            // ─── Отклик на касание вместо реакции на курсор ───
            const onPress = () => {
                gsap.to(card, {
                    scale: 0.955,
                    rotation: rot * 0.35,
                    duration: 0.22,
                    ease: 'power2.out',
                    overwrite: 'auto',
                });
            };
            const onRelease = () => {
                gsap.to(card, {
                    scale: 1,
                    rotation: rot,
                    duration: 1.1,
                    ease: 'elastic.out(1, 0.4)',
                    overwrite: 'auto',
                });
            };
            card.addEventListener('touchstart', onPress, { passive: true });
            card.addEventListener('touchend', onRelease);
            card.addEventListener('touchcancel', onRelease);
        });

        // Один пересчёт после подгрузки шрифтов и картинок: частые пересчёты сами дают рывки
        setTimeout(() => ScrollTrigger.refresh(), 1200);
    }
}
