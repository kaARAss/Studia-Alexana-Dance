'use client';

import { useEffect, useRef } from 'react';

export default function Showreel() {
    const videoRef = useRef(null);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        // Гарантируем бесшовный бесконечный повтор без чёрных кадров:
        // как только видео почти дошло до конца — мгновенно переводим в начало.
        const onTimeUpdate = () => {
            if (!video.duration) return;
            if (video.currentTime >= video.duration - 0.15) {
                video.currentTime = 0;
                const p = video.play();
                if (p && typeof p.catch === 'function') p.catch(() => {});
            }
        };
        const onEnded = () => {
            video.currentTime = 0;
            const p = video.play();
            if (p && typeof p.catch === 'function') p.catch(() => {});
        };

        const tryPlay = () => {
            const p = video.play();
            if (p && typeof p.catch === 'function') p.catch(() => {});
        };

        video.addEventListener('timeupdate', onTimeUpdate);
        video.addEventListener('ended', onEnded);
        video.addEventListener('canplay', tryPlay);
        tryPlay();

        return () => {
            video.removeEventListener('timeupdate', onTimeUpdate);
            video.removeEventListener('ended', onEnded);
            video.removeEventListener('canplay', tryPlay);
        };
    }, []);

    return (
        <section className="showreel-section" id="showreel-section">
            <div className="showreel__content">
                <h2 className="showreel__title">Наши выступления</h2>
                <div className="showreel__video-wrap">
                    <video
                        ref={videoRef}
                        className="showreel__video"
                        src="/assets/perf.mp4"
                        poster="/assets/perf-poster.jpg"
                        autoPlay
                        loop
                        muted
                        playsInline
                        preload="auto"
                        controls
                    />
                </div>
            </div>
        </section>
    );
}
