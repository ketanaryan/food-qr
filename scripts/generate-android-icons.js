const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const resDir = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'res');
const srcIcon = path.join(__dirname, '..', 'public', 'icons', 'icon-512.png');

const sizes = {
  'mipmap-mdpi': 48,
  'mipmap-hdpi': 72,
  'mipmap-xhdpi': 96,
  'mipmap-xxhdpi': 144,
  'mipmap-xxxhdpi': 192
};

async function run() {
  if (!fs.existsSync(srcIcon)) {
    console.error('Source icon not found:', srcIcon);
    return;
  }

  for (const [folder, size] of Object.entries(sizes)) {
    const targetDir = path.join(resDir, folder);
    if (fs.existsSync(targetDir)) {
      await sharp(srcIcon)
        .resize(size, size)
        .toFile(path.join(targetDir, 'ic_launcher.png'));

      await sharp(srcIcon)
        .resize(size, size)
        .toFile(path.join(targetDir, 'ic_launcher_round.png'));
        
      console.log(`✓ Generated ${folder} (${size}x${size})`);
    }
  }

  console.log('Android app icons generated successfully!');
}

run().catch(console.error);
