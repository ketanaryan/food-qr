import fs from 'fs';
import https from 'https';

const download = (url, dest) => {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close(resolve);
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => reject(err));
    });
  });
};

async function run() {
  console.log('Downloading images...');
  
  // Mutton Biryani
  await download('https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Biryani_of_Lahore.jpg/640px-Biryani_of_Lahore.jpg', 'public/menu/mutton-biryani.jpg');
  
  // Dal Makhani
  await download('https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Dal_Makhani.jpg/640px-Dal_Makhani.jpg', 'public/menu/dal-makhani.jpg');
  
  // Gulab Jamun
  await download('https://upload.wikimedia.org/wikipedia/commons/thumb/c/c4/Gulab_jamun_%28Dessert%29.jpg/640px-Gulab_jamun_%28Dessert%29.jpg', 'public/menu/gulab-jamun.jpg');
  
  // Masala Chaas (using a lassi image)
  await download('https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/Mint_Lassi.JPG/640px-Mint_Lassi.JPG', 'public/menu/masala-chaas.jpg');

  console.log('Done downloading!');
}
run();
