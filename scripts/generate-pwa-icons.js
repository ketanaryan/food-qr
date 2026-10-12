const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const iconsDir = path.join(__dirname, '..', 'public', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

function createSvg(size, isMaskable = false) {
  const padding = isMaskable ? Math.round(size * 0.15) : Math.round(size * 0.05);
  const innerSize = size - padding * 2;
  const radius = isMaskable ? 0 : Math.round(size * 0.22);
  
  return `
  <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#f6d365" />
        <stop offset="50%" stop-color="#fda085" />
        <stop offset="100%" stop-color="#d4af37" />
      </linearGradient>
      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#18181b" />
        <stop offset="100%" stop-color="#09090b" />
      </linearGradient>
      <linearGradient id="borderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#d4af37" stop-opacity="0.6" />
        <stop offset="100%" stop-color="#d4af37" stop-opacity="0.1" />
      </linearGradient>
    </defs>

    <!-- Background -->
    <rect width="${size}" height="${size}" rx="${radius}" fill="url(#bgGrad)" />
    
    <!-- Subtle luxury inner border -->
    <rect x="${Math.round(size * 0.04)}" y="${Math.round(size * 0.04)}" 
          width="${size - Math.round(size * 0.08)}" height="${size - Math.round(size * 0.08)}" 
          rx="${Math.max(0, radius - Math.round(size * 0.04))}" 
          fill="none" stroke="url(#borderGrad)" stroke-width="${Math.max(1, Math.round(size * 0.012))}" />

    <!-- Center Monogram / Crest -->
    <g transform="translate(${size / 2}, ${size / 2})">
      <!-- Crown / Star Accent -->
      <polygon points="0,${-size * 0.26} ${size * 0.03},${-size * 0.20} ${size * 0.09},${-size * 0.24} ${size * 0.05},${-size * 0.17} ${size * 0.08},${-size * 0.11} 0,${-size * 0.14} ${-size * 0.08},${-size * 0.11} ${-size * 0.05},${-size * 0.17} ${-size * 0.09},${-size * 0.24} ${-size * 0.03},${-size * 0.20}" 
               fill="#f6d365" />

      <!-- Text "WB" -->
      <text x="0" y="${size * 0.09}" 
            font-family="Georgia, serif" 
            font-size="${size * 0.32}" 
            font-weight="bold" 
            letter-spacing="${size * 0.02}" 
            fill="url(#goldGrad)" 
            text-anchor="middle" 
            dominant-baseline="central">WB</text>

      <!-- Subtitle "HOTEL WHITE BLISS" -->
      <text x="0" y="${size * 0.28}" 
            font-family="system-ui, -apple-system, sans-serif" 
            font-size="${size * 0.05}" 
            font-weight="600" 
            letter-spacing="${size * 0.02}" 
            fill="#a1a1aa" 
            text-anchor="middle">WHITE BLISS</text>
    </g>
  </svg>
  `;
}

async function run() {
  console.log('Generating PWA and App icons...');

  const icon192Svg = Buffer.from(createSvg(192, false));
  await sharp(icon192Svg)
    .png()
    .toFile(path.join(iconsDir, 'icon-192.png'));
  console.log('✓ Created icon-192.png');

  const icon512Svg = Buffer.from(createSvg(512, false));
  await sharp(icon512Svg)
    .png()
    .toFile(path.join(iconsDir, 'icon-512.png'));
  console.log('✓ Created icon-512.png');

  const iconMaskableSvg = Buffer.from(createSvg(512, true));
  await sharp(iconMaskableSvg)
    .png()
    .toFile(path.join(iconsDir, 'icon-maskable-512.png'));
  console.log('✓ Created icon-maskable-512.png');

  const appleSvg = Buffer.from(createSvg(180, false));
  await sharp(appleSvg)
    .png()
    .toFile(path.join(iconsDir, 'apple-touch-icon.png'));
  console.log('✓ Created apple-touch-icon.png');

  console.log('All icons generated successfully!');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
