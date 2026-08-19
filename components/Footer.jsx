'use client';

import { useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SOCIAL_ICONS, WIGGLE_CONFIG } from '@/lib/data';

function initWiggle(element, intensity) {
    const target = element.querySelector('[data-wiggle-target]') || element;
    gsap.set(target, { transformOrigin: 'center center' });
    let tween;
    const onEnter = () => { tween = gsap.to(target, { rotation: intensity, duration: 0.17, repeat: -1, yoyo: true, ease: 'steps(1)' }); };
    const onLeave = () => { if (tween) { tween.kill(); gsap.to(target, { rotation: 0, duration: 0.3, ease: 'power2.out' }); } };
    element.addEventListener('mouseenter', onEnter);
    element.addEventListener('mouseleave', onLeave);
    return () => { element.removeEventListener('mouseenter', onEnter); element.removeEventListener('mouseleave', onLeave); };
}

export default function Footer() {
    useEffect(() => {
        gsap.registerPlugin(ScrollTrigger);

        // ─── Map link underline draw/undraw ───
        const footerMapLink = document.querySelector('.footer-map-link');
        if (footerMapLink) {
            const mapSvgPaths = footerMapLink.querySelectorAll('.draw-btn__svg path');
            mapSvgPaths.forEach(path => {
                const length = path.getTotalLength();
                gsap.set(path, { strokeDasharray: length, strokeDashoffset: 0 });
            });
            const onEnter = () => gsap.fromTo(mapSvgPaths, { strokeDashoffset: (i, el) => el.getTotalLength() }, { strokeDashoffset: 0, duration: 0.5, ease: 'power2.out', stagger: 0.1, overwrite: true });
            const onLeave = () => gsap.to(mapSvgPaths, { strokeDashoffset: 0, duration: 0.4, ease: 'power2.out', overwrite: true });
            footerMapLink.addEventListener('mouseenter', onEnter);
            footerMapLink.addEventListener('mouseleave', onLeave);
        }


        // ─── Footer sticker pop-up on scroll ───
        const isPhone = window.matchMedia('(max-width: 768px)').matches;
        const footerStickers = gsap.utils.toArray('.footer-sticker');
        const stickerRotations = [12, -10, 8, -12, 10, -8];
        gsap.set(footerStickers, { scale: 0, opacity: 0, transformOrigin: 'center bottom' });
        footerStickers.forEach((sticker, i) => gsap.set(sticker, { rotation: stickerRotations[i % stickerRotations.length] }));

        gsap.to(footerStickers, {
            scale: 1, opacity: 1,
            rotation: (i) => stickerRotations[i % stickerRotations.length] * 0.7,
            duration: 0.7, ease: 'back.out(1.7)', stagger: 0.12,
            scrollTrigger: {
                trigger: '.footer-stickers',
                start: isPhone ? 'top bottom' : 'top 80%',
                invalidateOnRefresh: true,
                toggleActions: isPhone ? 'play none none none' : 'play none none reverse'
            }
        });

        // ─── Sticker cursor-velocity push ───
        footerStickers.forEach((sticker, i) => {
            const baseRotation = stickerRotations[i % stickerRotations.length] * 0.7;
            const PROXIMITY_RADIUS = 180, STRENGTH = 4, MAX_PUSH = 55, MIN_SPEED = 3;
            let prevX = 0, prevY = 0;
            const clamp = (v, max) => Math.max(-max, Math.min(max, v));

            const onMove = (e) => {
                const dx = e.clientX - prevX, dy = e.clientY - prevY;
                prevX = e.clientX; prevY = e.clientY;
                const rect = sticker.getBoundingClientRect();
                const cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2;
                const dist = Math.hypot(e.clientX - cx, e.clientY - cy);
                const onSticker = e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom;
                const speed = Math.hypot(dx, dy);

                // Disable proximity push if the mouse is hovering over the open credits popup box

                if (!onSticker && dist < PROXIMITY_RADIUS && speed > MIN_SPEED) {
                    const falloff = 1 - (dist / PROXIMITY_RADIUS);
                    const pushX = clamp(dx * STRENGTH * falloff, MAX_PUSH);
                    const pushY = clamp(dy * STRENGTH * falloff, MAX_PUSH);
                    gsap.killTweensOf(sticker);
                    gsap.to(sticker, { x: pushX, y: pushY, rotation: baseRotation + pushX * 0.25, duration: 0.18, ease: 'power3.out' });
                    gsap.to(sticker, { x: 0, y: 0, rotation: baseRotation, duration: 1.1, ease: 'elastic.out(1, 0.35)', delay: 0.18 });
                }
            };
            document.addEventListener('mousemove', onMove);
            // No cleanup stored here to match original behaviour (lives for page lifetime)
        });

        // ─── Wiggle on footer interactive elements ───
        const wiggleTargets = [
            { selector: '.footer-column:first-child h3', key: 'jobHeading' },
            { selector: '.footer-map-link span', key: 'googleMap' },
            { selector: '.footer-email', key: 'email' },
            { selector: '.footer-whatsapp', key: 'whatsapp' },
            { selector: '.credits-name', key: 'socials' }, // Added wiggle target for names using social intensity
        ];
        wiggleTargets.forEach(({ selector, key }) => {
            document.querySelectorAll(selector).forEach(el => initWiggle(el, WIGGLE_CONFIG[key]));
        });

        // ─── Social icon wiggle ───
        document.querySelectorAll('.single-social').forEach(el => initWiggle(el, WIGGLE_CONFIG.socials));

        // ─── Карта: на компьютере делаем её квадратной по ширине блока.
        // На телефоне не трогаем — там остаётся невысокая полоса.
        let onMapResize = null;
        if (!isPhone) {
            const mapFrame = document.querySelector('.footer-column iframe');
            if (mapFrame) {
                const applySquare = () => {
                    const wrap = mapFrame.parentElement;
                    const inner = document.querySelector('.footer-inner');
                    const topRow = document.querySelector('.footer-top');
                    const bottomRow = document.querySelector('.footer-bottom');
                    if (!wrap || !inner || !topRow || !bottomRow) return;

                    // Весь подвал обязан помещаться в один экран:
                    // надпись со стикерами поднимается, лишний низ обрезается
                    Object.assign(inner.style, {
                        minHeight: 'calc(100vh - 20px)',
                        maxHeight: 'calc(100vh - 20px)',
                        paddingBottom: '24px',
                        overflow: 'hidden',
                    });
                    bottomRow.style.marginTop = '10px';

                    // Карта квадратная по ширине блока
                    let size = Math.max(0, wrap.clientWidth - 14);
                    if (!size) return;
                    mapFrame.style.height = size + 'px';

                    // Если не влезает — укорачиваем карту, оставляя зазор до надписи
                    const cs = window.getComputedStyle(inner);
                    const padV = parseFloat(cs.paddingTop || '0') + parseFloat(cs.paddingBottom || '0');
                    const limit = inner.clientHeight - padV - 50;
                    let guard = 0;
                    while (
                        guard < 80 &&
                        size > 170 &&
                        topRow.offsetHeight + bottomRow.offsetHeight + 10 > limit
                    ) {
                        size = Math.max(170, size - 20);
                        mapFrame.style.height = size + 'px';
                        guard += 1;
                    }
                };
                applySquare();
                setTimeout(applySquare, 600);
                onMapResize = applySquare;
                window.addEventListener('resize', onMapResize);
            }
        }

        // ─── Пересчёт позиций после подгрузки шрифтов и картинок ───
        const refreshTimers = [1400].map((ms) => setTimeout(() => ScrollTrigger.refresh(), ms));
        const onLoad = () => ScrollTrigger.refresh();
        window.addEventListener('load', onLoad);

        return () => {
            refreshTimers.forEach((id) => clearTimeout(id));
            window.removeEventListener('load', onLoad);
            if (onMapResize) window.removeEventListener('resize', onMapResize);
        };
    }, []);

    return (
        <div className="footer-inner">
            <div className="footer-top">
                {/* Jobs */}
                <div className="footer-column">
                    <span className="footer-badge">хочешь преподавать?</span>
                    <h3>ищем педагогов :)</h3>
                </div>
                {/* Office */}
                <div className="footer-column">
                    <span className="footer-badge">студия</span>
                    <address>
                        проспект Маршала Жукова, 76, Москва
                    </address>
                    <a href="https://yandex.ru/maps/?text=%D0%9C%D0%BE%D1%81%D0%BA%D0%B2%D0%B0%2C%20%D0%BF%D1%80%D0%BE%D1%81%D0%BF%D0%B5%D0%BA%D1%82%20%D0%9C%D0%B0%D1%80%D1%88%D0%B0%D0%BB%D0%B0%20%D0%96%D1%83%D0%BA%D0%BE%D0%B2%D0%B0%2C%2076&z=17" target="_blank" rel="noreferrer" className="footer-map-link">
                        <span>Посмотреть на карте</span>
                        <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 169 10" fill="none" className="draw-btn__svg">
                            <path d="M1 6.5661C56.3941 3.06082 112.187 1.20095 168 0.999878" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.25"></path>
                            <path d="M32.1313 8.63371C68.2147 6.92799 104.462 6.13378 140.695 6.25107" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.25"></path>
                        </svg>
                    </a>
                    <div style={{ marginTop: "22px", maxWidth: "660px", width: "100%", borderRadius: "28px", border: "4px solid var(--color-dark, #1a1a1a)", overflow: "hidden", lineHeight: 0, padding: "7px", backgroundColor: "var(--color-lightgreen, #e6fab9)" }}>
                        <iframe
                            src="https://yandex.ru/map-widget/v1/?text=%D0%9C%D0%BE%D1%81%D0%BA%D0%B2%D0%B0%2C%20%D0%BF%D1%80%D0%BE%D1%81%D0%BF%D0%B5%D0%BA%D1%82%20%D0%9C%D0%B0%D1%80%D1%88%D0%B0%D0%BB%D0%B0%20%D0%96%D1%83%D0%BA%D0%BE%D0%B2%D0%B0%2C%2076&z=17"
                            title="Наша студия на карте"
                            width="100%"
                            height="132"
                            frameBorder="0"
                            allowFullScreen={true}
                            loading="lazy"
                            style={{ display: "block", border: "none", borderRadius: "21px" }}
                        ></iframe>
                    </div>
                </div>
                {/* Contact */}
                <div className="footer-column">
                    <span className="footer-badge">контакты</span>
                    <a href="mailto:alexana2020@mail.ru" className="footer-email">alexana2020@mail.ru</a>
                    <a href="#" className="footer-whatsapp">напиши нам в Телеграм*</a>
                    <p className="footer-note">*мы танцуем целый день: лучше напишите, чем звоните.</p>
                    <div className="footer-socials" id="footer-socials">
                        {SOCIAL_ICONS.map(({ href, label, svg }) => (
                            <a
                                key={label}
                                href={href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="single-social w-inline-block"
                                aria-label={label}
                                dangerouslySetInnerHTML={{ __html: svg }}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* Big TRUUS wordmark */}
            <div className="footer-bottom">
                <div className="footer-big-text">
                    <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 1368 304" fill="none" className="footer-logo__svg">
                        <path fillRule="evenodd" clipRule="evenodd"
                            d="M64.5673 100.333L31.6022 100.333C24.1418 100.333 16.8004 98.0158 10.8622 93.4291C5.80406 89.5263 1.12647 83.6199 0.175091 74.889C-1.70387 57.6445 11.6947 57.4031 32.9262 57.4031C35.4235 57.4031 37.9288 57.5399 40.4262 57.5399L86.8136 57.5399L109.615 15.8972C109.615 15.8972 114.189 5.43627 132.424 1.33235C139.988 -0.373589 147.821 -0.397729 155.439 1.01048C155.439 1.01048 185.566 7.69745 174.586 32.0956L163.217 56.3892L254.446 56.3892C271.055 56.3892 280.284 72.2094 272.126 83.3061C271.919 83.5877 271.729 83.8855 271.483 84.151C256.483 100.583 216.764 100.341 216.764 100.341L143.191 100.341L110.915 164.869C107.68 171.315 105.286 178.179 103.986 185.292C101.512 198.827 101.941 217.472 119.874 225.269C149.557 238.169 187.128 198.666 187.128 198.666L279.816 113.257C287.585 106.103 296.766 100.655 306.819 97.6215C321.335 93.2359 340.3 92.8416 352.414 113.063C352.414 113.063 376.515 109.507 388.677 108.203C405.286 106.417 422.657 109.129 428.793 128.103C434.93 147.078 420.778 161.997 420.778 161.997L385.482 200.976C385.482 200.976 369.935 217.174 378.64 222.952C386.473 228.158 420.746 236.157 468.592 188.318C478.17 179 492.805 162.584 499.155 154.344C512.118 37.518 547.485 91.9565 591.803 106.127C591.803 106.127 612.734 110.818 599.779 135.048L571.785 185.309C569.644 189.155 567.995 193.275 567.044 197.58C565.569 204.219 565.252 212.901 571.285 218.333C571.285 218.333 591.193 237.058 635.123 192.881L673.503 151.882C679.711 145.251 687.226 139.988 695.646 136.746C703.035 133.897 711.954 132.231 720.62 135.04C720.62 135.04 743.191 138.403 741.138 175.524L741.138 198.658C741.138 198.658 738.815 235.32 790.157 203.285C790.157 203.285 826.349 183.353 866.529 131.563C866.529 131.563 885.477 101.733 927.361 104.928C931.682 105.258 935.955 106.191 939.951 107.897C945.588 110.311 952.509 113.981 954.69 123.613C955.142 125.593 954.824 129.721 951.796 134.927L949.956 138.379C944.74 148.18 940.522 154.497 935.036 164.145C931.349 170.631 928.21 176.916 923.286 187.039C919.893 194.015 909.705 213.577 924.658 220.634C942.782 229.188 969.317 209.546 983.936 195.182L1022.69 154.698C1022.69 154.698 1048.13 124.595 1070.57 133.881C1070.57 133.881 1098.1 141.63 1092.23 189.404C1092.23 189.404 1089.15 213.843 1102.49 217.166C1115.81 220.49 1153.32 214.728 1189.12 181.309C1217.27 155.028 1232.86 135.032 1238.25 127.685C1241.32 123.5 1244.71 119.565 1248.47 116.025C1259.64 105.507 1281.5 89.6792 1308.21 94.5315C1313.57 95.5052 1318.34 98.6757 1321.04 103.48C1324.2 109.121 1325.75 118.141 1319.07 131.571C1319.07 131.571 1389.65 190.515 1360.11 239.15C1340.13 272.046 1292.06 299.341 1252.7 303.719C1230.75 306.157 1202.42 292.332 1195.96 278.484C1195.96 278.484 1190.99 269.825 1199.38 261.134C1210.63 249.482 1224.45 239.158 1224.45 239.158C1224.45 239.158 1247.56 222.316 1266.65 236.004C1268.57 237.38 1270.69 238.45 1272.92 239.182C1278.6 241.057 1286.83 241.299 1285.74 226.324C1285.27 219.87 1283.17 213.658 1279.85 208.138C1274.18 198.723 1265.18 187.296 1255.24 179C1255.24 179 1129.85 317.342 1048.92 283.102C1048.92 283.102 1022.53 272.987 1020.41 229.888C1020.41 229.888 939.674 301.61 891.605 301.61C843.537 301.61 825.628 275.088 822.068 241.46C822.068 241.46 753.466 291.198 710.361 291.198C679.829 291.198 674.05 271.998 667.041 228.73C667.041 228.73 594.222 308.957 529.108 299.293C463.994 289.628 469.837 242.61 469.837 242.61C469.837 242.61 396.201 306.39 330.762 302.761C330.762 302.761 294.895 302.544 283.177 277.751C272.768 255.743 282.678 236.801 295.434 218.317C311.711 194.731 315.952 190.555 315.952 190.555C315.952 190.555 330.072 174.823 323.928 168.579C318.355 162.914 308.135 168.482 300.58 174.115C295.886 177.616 291.621 181.671 287.784 186.113C269.866 206.858 176.814 308.667 81.1292 302.761C-25.3773 296.187 25.2121 177.213 36.6762 154.698"
                            fill="currentColor"></path>
                    </svg>
                </div>

                {/* Stickers */}
                <div className="footer-stickers">
                    <div className="footer-sticker sticker-smiley">
                        <img src="/assets/Footer-Sticker SVG/footer-sticker-smiley.svg" width="100%" alt="" data-scroll-animation-target="" aria-hidden="true" />
                    </div>
                    <div className="footer-sticker sticker-heart">
                        <img src="/assets/Footer-Sticker SVG/footer-sticker-heart.svg" width="100%" alt="" data-scroll-animation-target="" aria-hidden="true" />
                    </div>
                    <div className="footer-sticker sticker-hands">
                        <img src="/assets/Footer-Sticker SVG/footer-sticker-hands.svg" width="100%" alt="" data-scroll-animation-target="" aria-hidden="true" />
                    </div>
                    <div className="footer-sticker sticker-100">
                        <img src="/assets/Footer-Sticker SVG/footer-sticker-100.svg" width="100%" alt="" data-scroll-animation-target="" aria-hidden="true" />
                    </div>
                    <div className="footer-sticker sticker-camera">
                        <img src="/assets/Footer-Sticker SVG/footer-sticker-camera.svg" width="100%" alt="" aria-hidden="true" />
                    </div>
                    <div className="footer-sticker sticker-boom">
                        <img src="/assets/Footer-Sticker SVG/footer-sticker-boom.svg" width="100%" alt="" data-scroll-animation-target="" aria-hidden="true" />
                    </div>
                </div>

                {/* Bottom row: credits */}
                <div className="footer-bottom-row">
                    <div></div>
                </div>
            </div>
        </div>
    );
}
