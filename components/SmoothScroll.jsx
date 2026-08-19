'use client';

import { useEffect } from 'react';
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export default function SmoothScroll() {
    useEffect(() => {
        gsap.registerPlugin(ScrollTrigger);

        // На сенсорных экранах инерционная прокрутка борется с родной прокруткой
        // телефона и даёт рывки, поэтому там её не включаем.
        const isTouch = window.matchMedia('(hover: none) and (pointer: coarse)').matches;

        // На телефоне браузер прячет и показывает адресную строку при каждом
        // движении пальца. Для страницы это выглядит как изменение размера окна,
        // и все анимации пересчитываются прямо во время прокрутки — отсюда рывки
        // и кратковременные замирания. Отключаем эту реакцию.
        ScrollTrigger.config({
            ignoreMobileResize: true,
            autoRefreshEvents: 'visibilitychange,DOMContentLoaded,load',
        });

        let lenis = null;
        let tickerFn = null;

        if (!isTouch) {
            lenis = new Lenis({
                duration: 1.2,
                easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
                smoothWheel: true,
                touchMultiplier: 1.5,
            });

            lenis.on('scroll', ScrollTrigger.update);
            tickerFn = (time) => { lenis.raf(time * 1000); };
            gsap.ticker.add(tickerFn);
            gsap.ticker.lagSmoothing(0);
            window.__lenis = lenis;
        }

        // Пересчёт только при реальном изменении ширины или повороте экрана.
        // Изменение одной только высоты на телефоне — это панели браузера, его игнорируем.
        let resizeTimer = null;
        let lastWidth = window.innerWidth;
        const onResize = () => {
            if (isTouch && window.innerWidth === lastWidth) return;
            lastWidth = window.innerWidth;
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => ScrollTrigger.refresh(), 250);
        };
        const onOrientation = () => {
            lastWidth = -1;
            onResize();
        };
        window.addEventListener('orientationchange', onOrientation);
        window.addEventListener('resize', onResize);

        // Dynamic Tab Title Change
        const originalTitle = document.title;
        const handleVisibility = () => {
            document.title = document.hidden ? "Вернись 🥺" : originalTitle;
        };
        document.addEventListener('visibilitychange', handleVisibility);

        return () => {
            if (lenis) {
                if (tickerFn) gsap.ticker.remove(tickerFn);
                lenis.destroy();
                delete window.__lenis;
            }
            clearTimeout(resizeTimer);
            window.removeEventListener('orientationchange', onOrientation);
            window.removeEventListener('resize', onResize);
            document.removeEventListener('visibilitychange', handleVisibility);
        };
    }, []);

    return null;
}
