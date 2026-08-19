import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Для GitHub Pages: адрес вида username.github.io/имя-репозитория
// требует префикс. Его подставляет workflow через переменную окружения.
// Для локальной разработки переменной нет — префикс пустой.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

/** @type {import('next').NextConfig} */
const nextConfig = {
    // Статический экспорт: на выходе папка out/ с готовыми html-файлами
    output: 'export',
    basePath,
    assetPrefix: basePath || undefined,
    trailingSlash: true,
    images: {
        unoptimized: true,
    },
    devIndicators: false,
    webpack: (config) => {
        config.resolve.alias['@'] = path.resolve(__dirname);
        return config;
    },
};

export default nextConfig;
