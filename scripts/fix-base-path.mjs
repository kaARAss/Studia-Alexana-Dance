/**
 * Доработка экспорта под GitHub Pages.
 *
 * В коде сайта картинки, шрифты и курсоры указаны абсолютно: "/assets/...", "/fonts/...".
 * Если сайт лежит не в корне домена, а в подпапке (username.github.io/repo),
 * такие пути ломаются. Скрипт проходит по папке out/ и добавляет префикс.
 * Также создаёт файл .nojekyll — без него GitHub Pages игнорирует папку _next.
 *
 * Запуск: node scripts/fix-base-path.mjs
 */
import fs from 'fs';
import path from 'path';

const OUT = path.resolve(process.cwd(), 'out');
const BASE = (process.env.NEXT_PUBLIC_BASE_PATH || '').replace(/\/$/, '');
const FOLDERS = ['assets', 'fonts'];
const EXTS = ['.html', '.css', '.js', '.txt', '.json'];

if (!fs.existsSync(OUT)) {
    console.error('Папка out/ не найдена. Сначала выполни: npm run build');
    process.exit(1);
}

// .nojekyll нужен всегда, даже если префикс пустой
fs.writeFileSync(path.join(OUT, '.nojekyll'), '');
console.log('Создан out/.nojekyll');

if (!BASE) {
    console.log('NEXT_PUBLIC_BASE_PATH пуст — сайт в корне домена, пути править не нужно.');
    process.exit(0);
}

function walk(dir) {
    const out = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) out.push(...walk(full));
        else if (EXTS.includes(path.extname(entry.name))) out.push(full);
    }
    return out;
}

let changedFiles = 0;
let changedLinks = 0;

for (const file of walk(OUT)) {
    const original = fs.readFileSync(file, 'utf8');
    let content = original;

    for (const folder of FOLDERS) {
        const target = `/${folder}/`;
        const prefixed = `${BASE}${target}`;
        const SENTINEL = `\u0000${folder}\u0000`;

        // 1) прячем уже исправленные пути, чтобы не поставить префикс дважды
        content = content.split(prefixed).join(SENTINEL);
        // 2) добавляем префикс остальным
        const parts = content.split(target);
        if (parts.length > 1) changedLinks += parts.length - 1;
        content = parts.join(prefixed);
        // 3) возвращаем спрятанные
        content = content.split(SENTINEL).join(prefixed);
    }

    if (content !== original) {
        fs.writeFileSync(file, content);
        changedFiles++;
    }
}

console.log(`Префикс "${BASE}" проставлен: файлов ${changedFiles}, ссылок ${changedLinks}`);
