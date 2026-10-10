import fs from 'fs';

const images = {
  'crispy-corn.jpg': 'https://images.unsplash.com/photo-1596662951482-0c4ba74a6df6?q=80&w=600&auto=format&fit=crop',
  'gulab-jamun.jpg': 'https://images.unsplash.com/photo-1551024601-bec78aea704b?q=80&w=600&auto=format&fit=crop',
  'masala-chaas.jpg': 'https://images.unsplash.com/photo-1544145945-f90425340c7e?q=80&w=600&auto=format&fit=crop',
  'oreo-shake.jpg': 'https://images.unsplash.com/photo-1553177595-4de2bb0842b9?q=80&w=600&auto=format&fit=crop',
  'paneer-tikka.jpg': 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?q=80&w=600&auto=format&fit=crop'
};

async function downloadImages() {
  for (const [filename, url] of Object.entries(images)) {
    console.log(`Downloading ${filename}...`);
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const buffer = await response.arrayBuffer();
      fs.writeFileSync(`public/menu/${filename}`, Buffer.from(buffer));
      console.log(`Saved ${filename} (${buffer.byteLength} bytes)`);
    } catch (err) {
      console.error(`Failed to download ${filename}:`, err);
    }
  }
}

downloadImages();
