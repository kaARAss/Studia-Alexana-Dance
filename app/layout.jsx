import './globals.css';

export const metadata = {
    title: 'Школа Танцев',
    description: 'Школа танцев: хип-хоп, балет, heels, contemporary и группы для детей.',
    icons: {
        icon: 'https://cdn.prod.website-files.com/683703490bc01e1b8c052e06/68381362603d6402ee03c00e_favicon.png',
    },
};

export const viewport = {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
    viewportFit: 'cover',
    themeColor: '#f0ebe6',
};

export default function RootLayout({ children }) {
    return (
        <html lang="ru">
            <body>{children}</body>
        </html>
    );
}
