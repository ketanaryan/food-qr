const fs = require("fs");
const path = require("path");

const files = [
  ".github/workflows/build-apk.yml",
  "capacitor.config.json",
  "public/manifest-captain.json",
  "public/manifest.json",
  "scripts/configure-app.js",
  "src/app/admin/attendo/page.tsx",
  "src/app/admin/crm/page.tsx",
  "src/app/admin/dashboard/page.tsx",
  "src/app/admin/inventory/page.tsx",
  "src/app/admin/layout.tsx",
  "src/app/admin/menu/page.tsx",
  "src/app/admin/qr/page.tsx",
  "src/app/admin/sales/page.tsx",
  "src/app/app/page.tsx",
  "src/app/bill/[ids]/layout.tsx",
  "src/app/bill/[ids]/page.tsx",
  "src/app/captain/layout.tsx",
  "src/app/captain/page.tsx",
  "src/app/cashier/page.tsx",
  "src/app/kitchen/page.tsx",
  "src/app/layout.tsx",
  "src/app/manifest.ts",
  "src/app/pos/layout.tsx",
  "src/app/pos/page.tsx",
  "src/app/staff/login/page.tsx",
  "src/app/staff/page.tsx",
  "src/app/table/[id]/orders/OrderTrackingClient.tsx",
  "src/components/LandingPage/SectionOne.tsx",
  "src/components/LandingPage/index.tsx",
  "src/components/MenuInterface/index.tsx",
  "src/components/RestaurantLanding/index.tsx",
  "src/components/common/Footer.tsx",
  "src/components/common/NavBar.tsx",
  "src/components/common/PwaInstallPrompt.tsx",
  "src/lib/inventoryStore.ts",
  "src/lib/inventoryTypes.ts",
  "src/lib/whatsapp.ts",
  "src/middleware.ts"
];

const replacements = [
  ["Hotel Marquis Pure Veg", "Hotel White Bliss"],
  ["HOTEL MARQUIS", "HOTEL WHITE BLISS"],
  ["Hotel Marquis", "Hotel White Bliss"],
  ["Marquis POS", "Bliss POS"],
  ["Marquis Captain", "Bliss Captain"],
  ["Marquis Kitchen", "Bliss Kitchen"],
  ["hotel-marquis.jpg", "hotel-white-bliss.jpg"],
  ["hotel-marquis.png", "hotel-white-bliss.jpg"],
  ["Marquis Pure Veg", "Hotel White Bliss"],
  ["Marquis", "White Bliss"],
  ["marquis", "white-bliss"],
  ["Sula Vineyard Road, opp. Podar International School (off Gangapur Road, Nashik)", "Dnyaneshwar Nagar, Pathardi Phata, Nashik"],
  ["Sula Vineyard Road, opp. Podar School, Nashik 422012", "Dnyaneshwar Nagar, Pathardi Phata, Nashik 422009"],
  ["Sula Vineyard Road, Nashik", "Pathardi Phata, Nashik"],
  ["0788 788 1769", "+91 7499934257"],
  ["Marquis+Pure+Veg+Nashik", "Hotel+White+Bliss+Nashik"],
  ["Hotel+Marquis", "Hotel+White+Bliss+Nashik"]
];

let totalChanges = 0;
for (const file of files) {
  const fullPath = path.join(process.cwd(), file);
  if (!fs.existsSync(fullPath)) continue;
  let content = fs.readFileSync(fullPath, "utf8");
  let modified = content;
  for (const [from, to] of replacements) {
    modified = modified.split(from).join(to);
  }
  if (content !== modified) {
    fs.writeFileSync(fullPath, modified, "utf8");
    console.log("Updated: " + file);
    totalChanges++;
  }
}
console.log("SUCCESS: Total files updated to Hotel White Bliss: " + totalChanges);
