import fs from 'fs';

// A beautiful, wide restaurant interior shot
const heroUrl = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=2000&auto=format&fit=crop';

async function download() {
  console.log('Downloading hero image...');
  const res = await fetch(heroUrl);
  const buffer = await res.arrayBuffer();
  fs.writeFileSync('public/hero-bg.jpg', Buffer.from(buffer));
  console.log('Done!');
}

download();
