"use client";

import gsap from "gsap";
import React, { useEffect, useRef } from "react";
import { InertiaPlugin } from "gsap/InertiaPlugin";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(InertiaPlugin, ScrollTrigger);

// Ограничитель смещения: карточка отходит от курсора не дальше 45px
const clampPush = (v) => Math.max(-45, Math.min(45, v));

export default function MotionCards() {
    const sectionRef = useRef(null);
    const containerRef = useRef(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            // Inertia on cards
            const cards = document.querySelectorAll(".motion-card__card");
            cards.forEach((card) => {
                let lastX = 0;
                let lastY = 0;
                let speedX = 0;
                let speedY = 0;
                let offX = 0;
                let offY = 0;

                const startRotation = gsap.getProperty(card, "rotation");
                const startX = gsap.getProperty(card, "x");
                const startY = gsap.getProperty(card, "y");

                const onMove = (e) => {
                    speedX = e.clientX - lastX;
                    speedY = e.clientY - lastY;
                    lastX = e.clientX;
                    lastY = e.clientY;

                    // Реакция сразу под курсором, а не только при уходе с неё
                    offX = clampPush(offX + speedX * 0.35);
                    offY = clampPush(offY + speedY * 0.35);
                    gsap.to(card, {
                        x: startX + offX,
                        y: startY + offY,
                        rotation: startRotation + offX * 0.05,
                        duration: 0.45,
                        ease: "power3.out",
                        overwrite: true,
                    });
                };

                const onEnter = (e) => {
                    speedX = 0;
                    speedY = 0;
                    lastX = e.clientX;
                    lastY = e.clientY;
                };

                const onLeave = () => {
                    offX = 0;
                    offY = 0;
                    gsap.to(card, {
                        overwrite: true,
                        inertia: {
                            x: { velocity: speedX * 20, end: startX },
                            y: { velocity: speedY * 20, end: startY },
                            rotation: { velocity: speedX * 1.5, end: startRotation },
                        },
                    });
                };

                card.addEventListener("mousemove", onMove);
                card.addEventListener("mouseenter", onEnter);
                card.addEventListener("mouseleave", onLeave);
            });

            // Inertia on floating labels
            const labels = document.querySelectorAll(".motion-card__floating-label");
            labels.forEach((label) => {
                let lastX = 0;
                let lastY = 0;
                let speedX = 0;
                let speedY = 0;
                let offX = 0;
                let offY = 0;

                const startRotation = gsap.getProperty(label, "rotation");
                const startX = gsap.getProperty(label, "x");
                const startY = gsap.getProperty(label, "y");

                const onMove = (e) => {
                    speedX = e.clientX - lastX;
                    speedY = e.clientY - lastY;
                    lastX = e.clientX;
                    lastY = e.clientY;

                    // Реакция сразу под курсором, а не только при уходе с неё
                    offX = clampPush(offX + speedX * 0.45);
                    offY = clampPush(offY + speedY * 0.45);
                    gsap.to(label, {
                        x: startX + offX,
                        y: startY + offY,
                        rotation: startRotation + offX * 0.07,
                        duration: 0.45,
                        ease: "power3.out",
                        overwrite: true,
                    });
                };

                const onEnter = (e) => {
                    speedX = 0;
                    speedY = 0;
                    lastX = e.clientX;
                    lastY = e.clientY;
                };

                const onLeave = () => {
                    offX = 0;
                    offY = 0;
                    gsap.to(label, {
                        overwrite: true,
                        inertia: {
                            x: { velocity: speedX * 25, end: startX },
                            y: { velocity: speedY * 25, end: startY },
                            rotation: { velocity: speedX * 2, end: startRotation },
                        },
                    });
                };

                label.addEventListener("mousemove", onMove);
                label.addEventListener("mouseenter", onEnter);
                label.addEventListener("mouseleave", onLeave);
            });

            // Entry Animations: Sticker Pop & Underline Draw
            const tl = gsap.timeline({
                scrollTrigger: {
                    trigger: sectionRef.current,
                    start: "top 70%",
                    toggleActions: "play none none reverse"
                }
            });

            const topStickerImg = sectionRef.current.querySelector(".motion-card__sticker--top img");
            if (topStickerImg) {
                gsap.set(topStickerImg, { scale: 0, opacity: 0, rotation: -30 });
                tl.to(topStickerImg, { scale: 1, opacity: 1, rotation: 0, duration: 1.7, ease: "elastic.out(1, 0.4)" }, 0);
            }

            const underlinePath = sectionRef.current.querySelector(".motion-card__underline-path");
            if (underlinePath) {
                const pathLen = underlinePath.getTotalLength();
                gsap.set(underlinePath, { strokeDasharray: pathLen, strokeDashoffset: pathLen });
                tl.to(underlinePath, { strokeDashoffset: 0, duration: 1.5, ease: "power2.out" }, 0.2);
            }
            // ─── Только ПК: крупные стикеры и набор нижнего абзаца ───
            const isDesktop = window.matchMedia('(min-width: 769px)').matches;

            if (isDesktop) {
                // Плашки-подписи над карточками были слишком мелкими
                sectionRef.current.querySelectorAll('.motion-card__floating-label').forEach((label) => {
                    Object.assign(label.style, {
                        padding: '0.5vw 1.15vw',
                        boxShadow: '0 6px 18px rgba(0,0,0,0.08)',
                    });
                    const inner = label.querySelector('.motion-card__floating-text');
                    if (inner) {
                        Object.assign(inner.style, {
                            fontSize: 'clamp(1.15rem, 1.35vw, 1.65rem)',
                            fontWeight: '600',
                            letterSpacing: '-0.3px',
                        });
                    }
                });

                const footerText = sectionRef.current.querySelector('.motion-card__footer-text');
                const descr = sectionRef.current.querySelector('.motion-card__description');

                if (footerText && descr && !descr.dataset.styled) {
                    descr.dataset.styled = '1';

                    // Спускаем ниже и даём воздуха, чтобы текст не наезжал ни на фотографии
                    // сверху, ни на тёмный блок снизу
                    Object.assign(footerText.style, {
                        maxWidth: '900px',
                        marginTop: '210px',
                        paddingBottom: '120px',
                        position: 'relative',
                        zIndex: '5',
                    });

                    Object.assign(descr.style, {
                        fontFamily: "'Epilogue', sans-serif",
                        fontSize: 'clamp(1.5rem, 1.9vw, 2.2rem)',
                        fontWeight: '700',
                        lineHeight: '1.28',
                        letterSpacing: '-0.8px',
                    });

                }
            }
        }, sectionRef);

        return () => ctx.revert();
    }, []);

    return (
        <section
            ref={sectionRef}
            className="motion-card-section" id="motion-card-section">
            {/* ─── Part 1: Bold Heading Text with SVG Sticker Placeholders ─── */}
            <div className="motion-card__heading">
                <h2 className="motion-card__title">
                    школа танца
                    <br />
                    для тех, кто горит.
                </h2>
                <p className="motion-card__subtitle">
                    от первого шага до сцены.
                    {/* SVG sticker placeholder — top-right area */}
                    <span className="motion-card__sticker motion-card__sticker--top" style={{ right: "-120px", top: "-34px" }}>
                        <img
                            src="/assets/Footer-Sticker SVG/footer-sticker-hands.svg"
                            alt="Стикер с сердцем"
                            className="motion-card__sticker-img"
                        />
                    </span>
                </p>
                <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 634 28" fill="none" className="motion-card__underline-svg">
                    <path className="motion-card__underline-path" d="M2 26C41.0237 23.1556 79.9927 19.9419 118.634 15.5521C169.106 9.98633 227.314 2.42393 275.206 2C280.46 2.57436 264.768 4.99488 262.462 5.55556C257.837 6.43078 252.529 7.47009 247.317 8.59146C239.594 10.3556 212.496 15.8393 226.932 19.8051C239.594 22.6359 263.663 21.9521 280.978 21.3504C314.817 19.9829 349.311 16.7419 383.204 14.7863C465.931 9.5077 549.191 10.547 632 14.1436" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </div>

            {/* ─── Part 2: Cards with Colorful Bars & Blue Blob ─── */}
            <div className="motion-card__cards-area">
                {/* Blue SVG blob behind everything */}
                <div className="motion-card__blob">
                    <img
                        src="/assets/MotionCard SVG/motion-card-blob.svg"
                        alt=""
                        className="motion-card__blob-svg"
                    />
                </div>


                {/* 4 Photo Cards */}
                <div ref={containerRef} className="motion-card__cards">
                    <div className="motion-card__card motion-card__card--1">
                        <div className="motion-card__card-image">
                            <img
                                src="/assets/photos/motion1.jpg"
                                loading="lazy"
                                width={1000}
                                height={1000}
                                alt=""
                                className="cover-image"
                            />
                        </div>
                    </div>

                    <div className="motion-card__card motion-card__card--2">
                        <div className="motion-card__card-image">
                            <img
                                src="/assets/photos/motion2.jpg"
                                loading="lazy"
                                width={1000}
                                height={1000}
                                alt=""
                                className="cover-image"
                            />
                        </div>
                    </div>

                    <div className="motion-card__card motion-card__card--3">
                        <div className="motion-card__card-image">
                            <img
                                src="/assets/photos/motion3.jpg"
                                loading="lazy"
                                width={1000}
                                height={1000}
                                alt=""
                                className="cover-image"
                            />
                        </div>
                    </div>

                    <div className="motion-card__card motion-card__card--4">
                        <div className="motion-card__card-image">
                            <img
                                src="/assets/photos/motion4.jpg"
                                loading="lazy"
                                width={1000}
                                height={1000}
                                alt=""
                                className="cover-image"
                            />
                        </div>
                    </div>

                    <div className="motion-card__card motion-card__card--5">
                        <div className="motion-card__card-image">
                            <img
                                src="/assets/photos/motion5.jpg"
                                loading="lazy"
                                width={1000}
                                height={1000}
                                alt=""
                                className="cover-image"
                            />
                        </div>
                    </div>
                </div>

                {/* Floating labels — positioned freely over the cards area */}
                <div ref={containerRef} className="motion-card__floating-labels">
                    <div className="motion-card__floating-label motion-card__floating-label--pink">
                        <p className="motion-card__floating-text">танцевать можно в любом возрасте!</p>
                    </div>
                    <div className="motion-card__floating-label motion-card__floating-label--orange">
                        <p className="motion-card__floating-text">не умеешь — научим</p>
                    </div>
                    <div className="motion-card__floating-label motion-card__floating-label--red">
                        <p className="motion-card__floating-text">стесняться = немодно</p>
                    </div>
                </div>
            </div>

            {/* ─── Part 3: Bottom Paragraph Text ─── */}
            <div className="motion-card__footer-text">
                <p className="motion-card__description">
                    Мы учим танцевать с нуля и доводим до сцены.
                    Хип-хоп, балет, heels, contemporary
                    и группы для детей — занятия каждый день,
                    отчётные концерты и баттлы.
                </p>
            </div>
        </section>
    );
}
