const fs = require('fs');
const path = require('path');

const target = (process.argv[2] || 'pos').toLowerCase();

const configs = {
  pos: {
    appId: 'com.hotelwhitebliss.pos',
    appName: 'Bliss POS',
    url: 'https://food-qr-gilt.vercel.app/pos',
    scheme: 'com.hotelwhitebliss.pos'
  },
  captain: {
    appId: 'com.hotelwhitebliss.captain',
    appName: 'Bliss Captain',
    url: 'https://food-qr-gilt.vercel.app/captain',
    scheme: 'com.hotelwhitebliss.captain'
  }
};

const cfg = configs[target];
if (!cfg) {
  console.error(`Unknown target: ${target}. Use 'pos' or 'captain'.`);
  process.exit(1);
}

const rootDir = path.resolve(__dirname, '..');

// 1. Update root capacitor.config.json
const capConfigPath = path.join(rootDir, 'capacitor.config.json');
let capConfig = {};
try {
  capConfig = JSON.parse(fs.readFileSync(capConfigPath, 'utf8'));
} catch (e) {
  capConfig = { webDir: "public", bundledWebRuntime: false };
}

capConfig.appId = cfg.appId;
capConfig.appName = cfg.appName;
capConfig.server = {
  url: cfg.url,
  cleartext: true
};
capConfig.android = {
  allowMixedContent: true,
  captureInput: true,
  webContentsDebuggingEnabled: false
};

fs.writeFileSync(capConfigPath, JSON.stringify(capConfig, null, 2));
console.log(`✓ Updated root capacitor.config.json for ${cfg.appName} -> ${cfg.url}`);

// 2. Update android/app/src/main/res/values/strings.xml
const stringsPath = path.join(rootDir, 'android/app/src/main/res/values/strings.xml');
if (fs.existsSync(stringsPath)) {
  const stringsContent = `<?xml version='1.0' encoding='utf-8'?>
<resources>
    <string name="app_name">${cfg.appName}</string>
    <string name="title_activity_main">${cfg.appName}</string>
    <string name="package_name">${cfg.appId}</string>
    <string name="custom_url_scheme">${cfg.scheme}</string>
</resources>
`;
  fs.writeFileSync(stringsPath, stringsContent);
  console.log(`✓ Updated strings.xml with app_name: "${cfg.appName}" and package_name: "${cfg.appId}"`);
}

// 3. Update android/app/build.gradle applicationId
const gradlePath = path.join(rootDir, 'android/app/build.gradle');
if (fs.existsSync(gradlePath)) {
  let gradleContent = fs.readFileSync(gradlePath, 'utf8');
  gradleContent = gradleContent.replace(
    /applicationId\s+["'][^"']+["']/,
    `applicationId "${cfg.appId}"`
  );
  fs.writeFileSync(gradlePath, gradleContent);
  console.log(`✓ Updated build.gradle with applicationId: "${cfg.appId}"`);
}

// 4. Update android/app/src/main/assets/capacitor.config.json
const assetsCapPath = path.join(rootDir, 'android/app/src/main/assets/capacitor.config.json');
if (fs.existsSync(assetsCapPath)) {
  fs.writeFileSync(assetsCapPath, JSON.stringify(capConfig, null, 2));
  console.log(`✓ Updated android assets capacitor.config.json`);
}

console.log(`\n🎉 Successfully configured build target for: ${cfg.appName} (${cfg.appId})\n`);
