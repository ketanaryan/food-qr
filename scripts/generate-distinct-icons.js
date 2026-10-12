const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const iconsDir = path.join(__dirname, '..', 'public', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// 1. CAPTAIN ICON SVG GENERATOR (Deep Navy & Emerald/Cyan)
function createCaptainSvg(size) {
  const radius = Math.round(size * 0.22);
  return `
  <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="captBg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#0f172a" />
        <stop offset="50%" stop-color="#1e1b4b" />
        <stop offset="100%" stop-color="#020617" />
      </linearGradient>
      <linearGradient id="captGlow" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#38bdf8" />
        <stop offset="100%" stop-color="#818cf8" />
      </linearGradient>
      <linearGradient id="pillGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#059669" />
        <stop offset="100%" stop-color="#10b981" />
      </linearGradient>
    </defs>

    <!-- App Icon Background -->
    <rect width="${size}" height="${size}" rx="${radius}" fill="url(#captBg)" />
    
    <!-- Neon border -->
    <rect x="${Math.round(size * 0.03)}" y="${Math.round(size * 0.03)}" 
          width="${size - Math.round(size * 0.06)}" height="${size - Math.round(size * 0.06)}" 
          rx="${Math.max(0, radius - Math.round(size * 0.03))}" 
          fill="none" stroke="url(#captGlow)" stroke-width="${Math.max(2, Math.round(size * 0.015))}" opacity="0.6" />

    <!-- Chef Hat Symbol (Top) -->
    <g transform="translate(${size / 2}, ${size * 0.28})">
      <!-- Chef Hat Icon Path -->
      <path d="M ${-size * 0.12} ${size * 0.05} 
               C ${-size * 0.16} ${-size * 0.05}, ${-size * 0.10} ${-size * 0.15}, ${-size * 0.04} ${-size * 0.12}
               C ${-size * 0.03} ${-size * 0.19}, ${size * 0.03} ${-size * 0.19}, ${size * 0.04} ${-size * 0.12}
               C ${size * 0.10} ${-size * 0.15}, ${size * 0.16} ${-size * 0.05}, ${size * 0.12} ${size * 0.05}
               Z" 
            fill="#38bdf8" />
      <rect x="${-size * 0.09}" y="${size * 0.06}" width="${size * 0.18}" height="${size * 0.03}" rx="${size * 0.01}" fill="#f8fafc" />
    </g>

    <!-- Main Title: CAPTAIN -->
    <text x="${size / 2}" y="${size * 0.55}" 
          font-family="system-ui, -apple-system, sans-serif" 
          font-size="${size * 0.16}" 
          font-weight="900" 
          letter-spacing="${size * 0.01}" 
          fill="#ffffff" 
          text-anchor="middle" 
          dominant-baseline="central">CAPTAIN</text>

    <!-- Subtitle Pill: WAITER APP -->
    <g transform="translate(${size / 2}, ${size * 0.74})">
      <rect x="${-size * 0.32}" y="${-size * 0.065}" width="${size * 0.64}" height="${size * 0.13}" rx="${size * 0.065}" fill="url(#pillGrad)" />
      <text x="0" y="${size * 0.005}" 
            font-family="system-ui, -apple-system, sans-serif" 
            font-size="${size * 0.065}" 
            font-weight="800" 
            letter-spacing="${size * 0.02}" 
            fill="#ffffff" 
            text-anchor="middle" 
            dominant-baseline="central">WAITER APP</text>
    </g>
  </svg>`;
}

// 2. POS ICON SVG GENERATOR (Obsidian Black & Luxury Gold)
function createPosSvg(size) {
  const radius = Math.round(size * 0.22);
  return `
  <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="posBg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#18181b" />
        <stop offset="50%" stop-color="#27272a" />
        <stop offset="100%" stop-color="#09090b" />
      </linearGradient>
      <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#fef08a" />
        <stop offset="40%" stop-color="#f59e0b" />
        <stop offset="100%" stop-color="#b45309" />
      </linearGradient>
      <linearGradient id="amberPill" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#d97706" />
        <stop offset="100%" stop-color="#b45309" />
      </linearGradient>
    </defs>

    <!-- App Icon Background -->
    <rect width="${size}" height="${size}" rx="${radius}" fill="url(#posBg)" />
    
    <!-- Gold border -->
    <rect x="${Math.round(size * 0.03)}" y="${Math.round(size * 0.03)}" 
          width="${size - Math.round(size * 0.06)}" height="${size - Math.round(size * 0.06)}" 
          rx="${Math.max(0, radius - Math.round(size * 0.03))}" 
          fill="none" stroke="url(#goldGrad)" stroke-width="${Math.max(2, Math.round(size * 0.015))}" opacity="0.7" />

    <!-- Crown & Cash Register Symbol (Top) -->
    <g transform="translate(${size / 2}, ${size * 0.23})">
      <polygon points="0,${-size * 0.08} ${size * 0.04},${-size * 0.03} ${size * 0.09},${-size * 0.06} ${size * 0.06},${size * 0.02} ${size * 0.08},${size * 0.07} 0,${size * 0.05} ${-size * 0.08},${size * 0.07} ${-size * 0.06},${size * 0.02} ${-size * 0.09},${-size * 0.06} ${-size * 0.04},${-size * 0.03}" 
               fill="#fef08a" />
    </g>

    <!-- Main Title: POS -->
    <text x="${size / 2}" y="${size * 0.52}" 
          font-family="system-ui, -apple-system, sans-serif" 
          font-size="${size * 0.27}" 
          font-weight="900" 
          letter-spacing="${size * 0.02}" 
          fill="url(#goldGrad)" 
          text-anchor="middle" 
          dominant-baseline="central">POS</text>

    <!-- Subtitle Pill: CASHIER & BILLS -->
    <g transform="translate(${size / 2}, ${size * 0.74})">
      <rect x="${-size * 0.32}" y="${-size * 0.065}" width="${size * 0.64}" height="${size * 0.13}" rx="${size * 0.065}" fill="url(#amberPill)" />
      <text x="0" y="${size * 0.005}" 
            font-family="system-ui, -apple-system, sans-serif" 
            font-size="${size * 0.065}" 
            font-weight="800" 
            letter-spacing="${size * 0.02}" 
            fill="#ffffff" 
            text-anchor="middle" 
            dominant-baseline="central">CASHIER</text>
    </g>
  </svg>`;
}

async function run() {
  const sizes = [180, 192, 512];

  for (const size of sizes) {
    // Generate Captain Icons
    const captSvg = createCaptainSvg(size);
    const captPath = size === 180 
      ? path.join(iconsDir, 'apple-touch-icon-captain.png')
      : path.join(iconsDir, `icon-captain-${size}.png`);
    await sharp(Buffer.from(captSvg)).resize(size, size).png().toFile(captPath);
    console.log(`Generated: ${captPath}`);

    // Generate POS Icons
    const posSvg = createPosSvg(size);
    const posPath = size === 180 
      ? path.join(iconsDir, 'apple-touch-icon-pos.png')
      : path.join(iconsDir, `icon-pos-${size}.png`);
    await sharp(Buffer.from(posSvg)).resize(size, size).png().toFile(posPath);
    console.log(`Generated: ${posPath}`);
  }

  // Also copy 180 to public root for convenient fallback
  fs.copyFileSync(path.join(iconsDir, 'apple-touch-icon-captain.png'), path.join(__dirname, '..', 'public', 'apple-touch-icon-captain.png'));
  fs.copyFileSync(path.join(iconsDir, 'apple-touch-icon-pos.png'), path.join(__dirname, '..', 'public', 'apple-touch-icon-pos.png'));

  console.log('\n🎉 ALL DISTINCT ICONS GENERATED SUCCESSFULLY!\n');
}

run().catch(console.error);
