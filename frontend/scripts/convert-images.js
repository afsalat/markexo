/**
 * Convert public PNG images to WebP for performance optimization.
 * Run: node scripts/convert-images.js
 */
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const PUBLIC_DIR = path.join(__dirname, '..', 'public');

const CONVERSIONS = [
    // Banners — quality 80 (visually lossless for photos)
    { file: 'banner1.png', quality: 80 },
    { file: 'banner2.png', quality: 80 },
    { file: 'banner3.png', quality: 80 },
    { file: 'banner4.png', quality: 80 },
    { file: 'banner5.png', quality: 80 },
    { file: 'banner6.png', quality: 80 },
    { file: 'banner7.png', quality: 80 },
    // Category & logos
    { file: 'all-categories.png', quality: 85 },
    { file: 'logo-black-text.png', quality: 90 },
    { file: 'logo-white-text.png', quality: 90 },
];

async function convert() {
    let totalSaved = 0;
    for (const { file, quality } of CONVERSIONS) {
        const src = path.join(PUBLIC_DIR, file);
        if (!fs.existsSync(src)) {
            console.log(`  SKIP  ${file} (not found)`);
            continue;
        }

        const dest = path.join(PUBLIC_DIR, file.replace(/\.png$/i, '.webp'));
        const originalSize = fs.statSync(src).size;

        await sharp(src)
            .webp({ quality })
            .toFile(dest);

        const newSize = fs.statSync(dest).size;
        const saved = originalSize - newSize;
        const pct = ((saved / originalSize) * 100).toFixed(1);
        totalSaved += saved;
        console.log(`  OK    ${file} -> ${file.replace('.png', '.webp')}  (${(originalSize / 1024).toFixed(0)} KiB -> ${(newSize / 1024).toFixed(0)} KiB, saved ${pct}%)`);
    }
    console.log(`\n  TOTAL SAVED: ${(totalSaved / 1024 / 1024).toFixed(2)} MiB`);
}

convert().catch(console.error);
