const fs = require('fs');
const https = require('https');
const file = fs.createWriteStream('public/menu/default-food.jpg');
https.get('https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=600', (response) => {
  response.pipe(file);
});
