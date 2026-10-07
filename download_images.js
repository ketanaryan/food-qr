const fs = require('fs');
const https = require('https');

const images = [
  { url: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?q=80&w=600', name: 'paneer-tikka.jpg' },
  { url: 'https://images.unsplash.com/photo-1626804475297-41609ea264eb?q=80&w=600', name: 'crispy-corn.jpg' },
  { url: 'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?q=80&w=600', name: 'butter-chicken.jpg' },
  { url: 'https://images.unsplash.com/photo-1605856403668-1bc43a18036d?q=80&w=600', name: 'garlic-naan.jpg' },
  { url: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?q=80&w=600', name: 'oreo-shake.jpg' },
];

images.forEach(({ url, name }) => {
  const file = fs.createWriteStream(`public/menu/${name}`);
  https.get(url, (response) => {
    response.pipe(file);
    file.on('finish', () => {
      file.close();
      console.log(`Downloaded ${name}`);
    });
  }).on('error', (err) => {
    fs.unlink(`public/menu/${name}`);
    console.error(`Error downloading ${name}: ${err.message}`);
  });
});
