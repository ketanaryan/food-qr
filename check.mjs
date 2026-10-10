const ids = [
  '1599487646910-cb56228e4fb7',
  '1606491956689-2ea866880c84',
  '1621510253015-96c2140bb063'
];

async function check() {
  for (const id of ids) {
    const res = await fetch(`https://images.unsplash.com/photo-${id}?q=80&w=600&auto=format&fit=crop`);
    console.log(id, res.status);
  }
}
check();
