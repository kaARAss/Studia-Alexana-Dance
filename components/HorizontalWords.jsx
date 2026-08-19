'use client';

import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import '../app/styles/horizontal-words.css';

gsap.registerPlugin(ScrollTrigger);

const HorizontalWords = () => {
    const sectionRef = useRef(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            const container = sectionRef.current;
            const textRef = container.querySelector('.horizontal-words__relative');
            const letters = container.querySelectorAll('.letter');

            // На телефоне блок прибивался к экрану на 2500 пикселей прокрутки и уводил
            // слова за край — получались пустые экраны. Показываем обычным блоком.
            if (window.matchMedia('(max-width: 768px)').matches) {
                container.classList.add('is-mobile-static');

                // Буквы лежат отдельными блоками, поэтому строка рвётся
                // по одной букве. Склеиваем их в неразрывные слова.
                const mobileH2 = container.querySelector('.horizontal-words__h2');
                if (mobileH2 && !mobileH2.dataset.mobileWords) {
                    mobileH2.dataset.mobileWords = '1';
                    const nodes = Array.from(mobileH2.children);
                    let wordBox = null;
                    nodes.forEach((el) => {
                        if (el.classList.contains('letter-space')) { wordBox = null; return; }
                        if (!el.classList.contains('letter')) return;
                        if (!wordBox) {
                            wordBox = document.createElement('span');
                            wordBox.className = 'hw-word';
                            mobileH2.insertBefore(wordBox, el);
                        }
                        wordBox.appendChild(el);
                    });
                }

                gsap.set(textRef, { clearProps: 'all' });
                return;
            }

            // ─── Нижний абзац: крупный шрифт и набор печатной машинкой ───
            const typeTarget = container.querySelector('.horizontal-words__bottom-text-l');
            if (typeTarget && !typeTarget.dataset.typed) {
                typeTarget.dataset.typed = '1';

                Object.assign(typeTarget.style, {
                    fontFamily: "'Epilogue', sans-serif",
                    fontSize: 'clamp(1.6rem, 2.5vw, 2.5rem)',
                    fontWeight: '750',
                    lineHeight: '1.18',
                    letterSpacing: '-1.2px',
                    maxWidth: '19em',
                    minHeight: '3.6em',
                    textAlign: 'center',
                });

                const fullText = 'Танец — это не только движения, а способ дышать чем кажется. Мы ставим технику, снимаем стеснение и доводим до сцены.';

                typeTarget.textContent = '';
                const typedNode = document.createTextNode('');
                typeTarget.appendChild(typedNode);

                const typeState = { chars: 0 };
                gsap.to(typeState, {
                    chars: fullText.length,
                    duration: fullText.length * 0.026,
                    ease: 'none',
                    scrollTrigger: {
                        // Блок прибивается к экрану, поэтому абзац становится видным не когда
                        // секция заходит в окно снизу, а когда она встаёт на весь экран.
                        trigger: container,
                        start: 'top top',
                        once: true,
                    },
                    onUpdate: () => {
                        typedNode.nodeValue = fullText.slice(0, Math.round(typeState.chars));
                    },
                    onComplete: () => {
                        typedNode.nodeValue = fullText;
                    },
                });
            }

            // Select the individual stickers instead of just the wrapper
            // or we select the images directly if they are the elements we want to animate.
            // The original logic animated .horizontal-words__sticker-svg, but since you have multiple images:
            const stickers = container.querySelectorAll('.horizontal-words__sticker-watch, .horizontal-words__sticker-cursor, .horizontal-words__sticker-phone');

            // Note: To animate SVG paths with strokeDashoffset, the SVG must be inlined in the HTML,
            // not loaded via <img> tags. The current setup uses <img> tags, so direct path animation
            // as written below will not work unless the SVGs are converted to inline <svg> elements.
            // For the purpose of this exercise, we'll assume the intent is for inline SVGs or
            // that the querySelectorAll will find nothing and the animation will gracefully skip.
            const arrows = container.querySelectorAll('.horizontal-words__arrow-svg path, .horizontal-words__arrow-end-svg path');

            // --- ENTRANCE & PINNING LOGIC ---
            // To make letters start animating as we scroll down from VimeoHero,
            // we start the horizontal movement as soon as the section enters the viewport (top bottom).
            const entranceDistance = window.innerHeight;
            const pinnedDistance = 2500;

            // Конечная точка горизонтальной промотки: лента останавливается тогда,
            // когда последняя стрелка оказывается по центру экрана — ровно над абзацем
            const endArrow = container.querySelector('.horizontal-words__arrow-end-svg');

            const finalX = () => {
                const fallback = -(textRef.scrollWidth - window.innerWidth * 0.5);
                if (!endArrow) return fallback;

                const arrowRect = endArrow.getBoundingClientRect();
                const trackRect = textRef.getBoundingClientRect();
                if (!arrowRect.width || !trackRect.width) return fallback;

                // Измеряем по реальным экранным координатам: так учтены
                // и отступы ленты, и собственный сдвиг стрелки.
                const currentX = Number(gsap.getProperty(textRef, 'x')) || 0;
                const arrowCenter = arrowRect.left + arrowRect.width / 2 - trackRect.left;
                const trackLeft = trackRect.left - currentX;

                return window.innerWidth * 0.5 - trackLeft - arrowCenter;
            };

            const scrollTween = gsap.timeline({
                scrollTrigger: {
                    trigger: container,
                    start: "top bottom",
                    end: () => `+=${entranceDistance + pinnedDistance}`,
                    scrub: 1,
                    invalidateOnRefresh: true,
                }
            });

            scrollTween
                .fromTo(textRef, {
                    x: window.innerWidth // Start words off-screen right
                }, {
                    x: window.innerWidth * 0.5,
                    ease: "none",
                    duration: entranceDistance
                })
                .to(textRef, {
                    x: finalX,
                    ease: "none",
                    duration: pinnedDistance
                });

            // Separate pinning logic so it only locks when the section hits the top
            ScrollTrigger.create({
                trigger: container,
                start: "top top",
                end: () => `+=${pinnedDistance}`,
                pin: true,
                pinSpacing: true,
                invalidateOnRefresh: true
            });
            // ------------------------------------

            // Bounce each letter randomly
            letters.forEach((letter) => {
                gsap.from(letter, {
                    yPercent: (Math.random() - 0.5) * 500,
                    rotation: (Math.random() - 0.5) * 60,
                    ease: "elastic.out(1.2, 1)",
                    scrollTrigger: {
                        trigger: letter,
                        containerAnimation: scrollTween,
                        start: 'left 90%',
                        end: 'left 50%', // Finish as it reaches center
                        scrub: 0.5
                    }
                });
            });

            // Bounce stickers
            stickers.forEach((sticker) => {
                gsap.from(sticker, {
                    scale: 0,
                    yPercent: (Math.random() - 0.5) * 400,
                    rotation: (Math.random() - 0.5) * 60,
                    ease: "elastic.out(1.2, 1)",
                    scrollTrigger: {
                        trigger: sticker,
                        containerAnimation: scrollTween,
                        start: 'left 90%',
                        end: 'left 50%', // Finish as it reaches center
                        scrub: 0.5
                    }
                });
            });

            // Animate Drawing SVG Arrows 
            arrows.forEach((arrowPath) => {
                if (arrowPath.getTotalLength) {
                    const pathLen = arrowPath.getTotalLength();
                    gsap.set(arrowPath, { strokeDasharray: pathLen, strokeDashoffset: pathLen });
                    gsap.to(arrowPath, {
                        strokeDashoffset: 0,
                        duration: 1,
                        scrollTrigger: {
                            trigger: arrowPath.parentElement,
                            containerAnimation: scrollTween,
                            start: 'left 90%',
                            end: 'left 50%', // This is the last arrow's end point
                            scrub: 0.5
                        }
                    });
                }
            });

        }, sectionRef);

        return () => ctx.revert();
    }, []);

    return (
        <section ref={sectionRef} className="horizontal-words-section content-section">
            <div className="horizontal-words__relative">
                <div className="horizontal-words__sticker-svg">
                    <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 386 127" fill="none" className="horizontal-words__arrow-svg"><path d="M2 123C9 35.9999 84.5 17 124 25.9999C217.764 47.3635 207 115 177.5 123C105.777 142.45 110.737 1.99991 232.5 2C310.5 2.00006 366.5 79 376 118L356.5 105.5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" ></path><path d="M2 123C9 35.9999 84.5 17 124 25.9999C217.764 47.3635 207 115 177.5 123C105.777 142.45 110.737 1.99991 232.5 2C310.5 2.00006 366.5 79 376 118L384 97" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" ></path></svg>
                    <img src="/assets/HorizontalWords SVG/horizontal-words-sticker-thumps-up.svg" className="horizontal-words__sticker-watch" style={{ transform: "translate(-50%, -156%)" }} alt="стикер класс" />
                    <img src="/assets/HorizontalWords SVG/horizontal-words-sticker-cursor.svg" className="horizontal-words__sticker-cursor" style={{ transform: "translate(-50%, 24%)" }} alt="стикер курсор" />
                    <img src="/assets/Card-Sticker SVG/sticker-phone.svg" className="horizontal-words__sticker-phone" style={{ left: "82%", transform: "translate(-50%, -118%)" }} alt="стикер с телефоном" />
                    <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 140 127" fill="none" className="horizontal-words__arrow-end-svg"><path d="M2.03125 2.42188C100.469 2.42188 130.156 52.4219 118.437 125.078L99.6875 107.891" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" ></path><path d="M2.03125 2.42188C100.469 2.42188 130.156 52.4219 118.438 125.078L137.969 110.234" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" ></path></svg>

                    <h2 className="display horizontal-words__h2" aria-label="Танцуй там где горит твоя душа">
                        <div className="letter" aria-hidden="true" style={{ position: "relative", display: "inline-block" }}>Т</div>
                        <div className="letter" aria-hidden="true" style={{ position: "relative", display: "inline-block" }}>а</div>
                        <div className="letter" aria-hidden="true" style={{ position: "relative", display: "inline-block" }}>н</div>
                        <div className="letter" aria-hidden="true" style={{ position: "relative", display: "inline-block" }}>ц</div>
                        <div className="letter" aria-hidden="true" style={{ position: "relative", display: "inline-block" }}>у</div>
                        <div className="letter" aria-hidden="true" style={{ position: "relative", display: "inline-block" }}>й</div>
                        <div className="letter-space" aria-hidden="true" style={{ display: "inline-block", width: "0.35em" }}></div>
                        <div className="letter" aria-hidden="true" style={{ position: "relative", display: "inline-block" }}>т</div>
                        <div className="letter" aria-hidden="true" style={{ position: "relative", display: "inline-block" }}>а</div>
                        <div className="letter" aria-hidden="true" style={{ position: "relative", display: "inline-block" }}>м</div>
                        <div className="letter-space" aria-hidden="true" style={{ display: "inline-block", width: "0.35em" }}></div>
                        <div className="letter" aria-hidden="true" style={{ position: "relative", display: "inline-block" }}>г</div>
                        <div className="letter" aria-hidden="true" style={{ position: "relative", display: "inline-block" }}>д</div>
                        <div className="letter" aria-hidden="true" style={{ position: "relative", display: "inline-block" }}>е</div>
                        <div className="letter-space" aria-hidden="true" style={{ display: "inline-block", width: "0.35em" }}></div>
                        <div className="letter" aria-hidden="true" style={{ position: "relative", display: "inline-block" }}>г</div>
                        <div className="letter" aria-hidden="true" style={{ position: "relative", display: "inline-block" }}>о</div>
                        <div className="letter" aria-hidden="true" style={{ position: "relative", display: "inline-block" }}>р</div>
                        <div className="letter" aria-hidden="true" style={{ position: "relative", display: "inline-block" }}>и</div>
                        <div className="letter" aria-hidden="true" style={{ position: "relative", display: "inline-block" }}>т</div>
                        <div className="letter-space" aria-hidden="true" style={{ display: "inline-block", width: "0.35em" }}></div>
                        <div className="letter" aria-hidden="true" style={{ position: "relative", display: "inline-block" }}>т</div>
                        <div className="letter" aria-hidden="true" style={{ position: "relative", display: "inline-block" }}>в</div>
                        <div className="letter" aria-hidden="true" style={{ position: "relative", display: "inline-block" }}>о</div>
                        <div className="letter" aria-hidden="true" style={{ position: "relative", display: "inline-block" }}>я</div>
                        <div className="letter-space" aria-hidden="true" style={{ display: "inline-block", width: "0.35em" }}></div>
                        <div className="letter" aria-hidden="true" style={{ position: "relative", display: "inline-block" }}>д</div>
                        <div className="letter" aria-hidden="true" style={{ position: "relative", display: "inline-block" }}>у</div>
                        <div className="letter" aria-hidden="true" style={{ position: "relative", display: "inline-block" }}>ш</div>
                        <div className="letter" aria-hidden="true" style={{ position: "relative", display: "inline-block" }}>а</div>
                    </h2>
                </div>
            </div>

            <div className="horizontal-words__bottom-text">
                <div className="horizontal-words__bottom-text-l">
                    Танец — это не только движения, <em>а</em> способ дышать<br />
                    чем кажется. Мы ставим технику, снимаем стеснение<br />
                    и доводим до сцены.
                </div>
            </div>
        </section>
    );
};

export default HorizontalWords;
