import sharp from 'sharp';
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const svgPath = join(__dirname, 'public', 'icon.svg');
const svgBuffer = readFileSync(svgPath);

// Generate apple-touch-icon (180x180)
await sharp(svgBuffer)
  .resize(180, 180)
  .png()
  .toFile(join(__dirname, 'public', 'apple-touch-icon.png'));

console.log('✅ Generated apple-touch-icon.png (180x180)');

// Generate favicon (32x32)
await sharp(svgBuffer)
  .resize(32, 32)
  .png()
  .toFile(join(__dirname, 'public', 'favicon-32x32.png'));

console.log('✅ Generated favicon-32x32.png (32x32)');

// Generate favicon (16x16)
await sharp(svgBuffer)
  .resize(16, 16)
  .png()
  .toFile(join(__dirname, 'public', 'favicon-16x16.png'));

console.log('✅ Generated favicon-16x16.png (16x16)');

// Generate larger icon for Android/PWA (192x192)
await sharp(svgBuffer)
  .resize(192, 192)
  .png()
  .toFile(join(__dirname, 'public', 'icon-192.png'));

console.log('✅ Generated icon-192.png (192x192)');

// Generate larger icon for Android/PWA (512x512)
await sharp(svgBuffer)
  .resize(512, 512)
  .png()
  .toFile(join(__dirname, 'public', 'icon-512.png'));

console.log('✅ Generated icon-512.png (512x512)');

console.log('\n🎉 All icons generated successfully!');
