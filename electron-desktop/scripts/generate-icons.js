#!/usr/bin/env node

/**
 * Icon Generator Script
 * 
 * This script helps generate placeholder icons for the Electron app.
 * For production, you should use proper icon files.
 * 
 * Usage: node scripts/generate-icons.js
 */

const fs = require('fs');
const path = require('path');

const resourcesDir = path.join(__dirname, '../resources');
const iconsDir = path.join(resourcesDir, 'icons');

// Ensure directories exist
if (!fs.existsSync(resourcesDir)) {
  fs.mkdirSync(resourcesDir, { recursive: true });
}

if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Simple 1x1 blue pixel PNG as placeholder
const placeholderPNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAFhAJ/wlseKgAAAABJRU5ErkJggg==',
  'base64'
);

// Create placeholder icon files
const iconFiles = [
  'icon.png',
  'tray-icon.png',
];

iconFiles.forEach(filename => {
  const filepath = path.join(resourcesDir, filename);
  if (!fs.existsSync(filepath)) {
    fs.writeFileSync(filepath, placeholderPNG);
    console.log(`Created placeholder: ${filename}`);
  }
});

// Create Linux icon sizes
const linuxSizes = [16, 32, 48, 64, 128, 256, 512];
linuxSizes.forEach(size => {
  const filename = `${size}x${size}.png`;
  const filepath = path.join(iconsDir, filename);
  if (!fs.existsSync(filepath)) {
    fs.writeFileSync(filepath, placeholderPNG);
    console.log(`Created placeholder: icons/${filename}`);
  }
});

console.log('\n✅ Placeholder icons created!');
console.log('\n⚠️  For production, replace these with proper icon files:');
console.log('   - icon.png (512x512 or larger)');
console.log('   - icon.icns (macOS app icon)');
console.log('   - icon.ico (Windows app icon)');
console.log('   - tray-icon.png (16x16 or 32x32)');
console.log('\nYou can use electron-icon-builder to generate icons from a source PNG:');
console.log('   npx electron-icon-builder --input=./source-icon.png --output=./resources');

