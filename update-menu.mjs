import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gockswbtqqltmnazsyae.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdvY2tzd2J0cXFsdG1uYXpzeWFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEzMDIxNDAsImV4cCI6MjEwNjg3ODE0MH0.qqyrIfZ8MBQF2APzdUK4jOuIrSKSSUazl0NMvbzofjs';
const supabase = createClient(supabaseUrl, supabaseKey);

const baseUrl = 'https://food-qr-gilt.vercel.app';
const authHeader = `Basic ${btoa("admin:aryan123")}`;

const premiumItems = [
  { name: 'Butter Chicken', description: 'Tender chicken simmered in a rich, creamy tomato and butter gravy.', price: 350, original_price: 400, section: 'Main Course', image_url: '/menu/butter-chicken.jpg', is_available: true },
  { name: 'Garlic Naan', description: 'Soft Indian bread with burnt garlic and butter, baked in a traditional tandoor.', price: 60, original_price: 80, section: 'Breads', image_url: '/menu/garlic-naan.jpg', is_available: true },
  { name: 'Classic Paneer Tikka', description: 'Tandoori marinated cottage cheese cubes roasted with peppers and onions.', price: 250, original_price: 280, section: 'Starters', image_url: '/menu/paneer-tikka.jpg', is_available: true },
  { name: 'Crispy Corn', description: 'Fried sweet corn kernels tossed in a spicy and tangy peri-peri seasoning.', price: 180, original_price: 200, section: 'Starters', image_url: '/menu/crispy-corn.jpg', is_available: true },
  { name: 'Mutton Biryani', description: 'Fragrant basmati rice cooked with tender mutton pieces and whole spices.', price: 450, original_price: 520, section: 'Rice & Biryani', image_url: '/menu/mutton-biryani.jpg', is_available: true },
  { name: 'Dal Makhani', description: 'Black lentils slow-cooked overnight with tomatoes, cream, and butter.', price: 220, original_price: 250, section: 'Main Course', image_url: '/menu/dal-makhani.jpg', is_available: true },
  { name: 'Gulab Jamun', description: 'Warm, melt-in-the-mouth milk dumplings soaked in rose-scented syrup.', price: 90, original_price: 110, section: 'Desserts', image_url: '/menu/gulab-jamun.jpg', is_available: true },
  { name: 'Masala Chaas', description: 'Refreshing spiced buttermilk with roasted cumin and fresh coriander.', price: 50, original_price: 60, section: 'Beverages', image_url: '/menu/masala-chaas.jpg', is_available: true },
  { name: 'Oreo Shake', description: 'Thick chocolate and crushed oreo milkshake topped with whipped cream.', price: 150, original_price: 180, section: 'Beverages', image_url: '/menu/oreo-shake.jpg', is_available: true }
];

async function run() {
  console.log('Fetching existing menu...');
  const { data: menu } = await supabase.from('menu').select('id');
  
  if (menu && menu.length > 0) {
    console.log(`Found ${menu.length} items. Deleting...`);
    for (const item of menu) {
      const res = await fetch(`${baseUrl}/api/admin/menu`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': authHeader },
        body: JSON.stringify({ action: 'delete', id: item.id })
      });
      if (!res.ok) console.error(`Failed to delete ${item.id}`, await res.text());
    }
  }

  console.log('Inserting premium menu...');
  for (const item of premiumItems) {
    const res = await fetch(`${baseUrl}/api/admin/menu`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': authHeader },
      body: JSON.stringify({ action: 'insert', data: item })
    });
    if (!res.ok) console.error(`Failed to insert ${item.name}`, await res.text());
  }

  console.log('Done!');
}

run();
