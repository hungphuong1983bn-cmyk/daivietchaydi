// Copy web assets of the game into ./www (Capacitor webDir).
// Only runtime files are copied: no tests/docs/CI files go into the APK.
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const out = path.join(root, 'www');

const INCLUDE = [
  'index.html',
  'admin-dai-viet.html',
  'manifest.webmanifest',
  'assets',
  'data',
  'icons',
  'js',
];

fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });

let files = 0, bytes = 0;
function copy(src, dst) {
  const st = fs.statSync(src);
  if (st.isDirectory()) {
    fs.mkdirSync(dst, { recursive: true });
    for (const n of fs.readdirSync(src)) copy(path.join(src, n), path.join(dst, n));
  } else {
    fs.copyFileSync(src, dst);
    files++; bytes += st.size;
  }
}

for (const item of INCLUDE) {
  const src = path.join(root, item);
  if (!fs.existsSync(src)) {
    console.error('Thiếu: ' + item);
    process.exit(1);
  }
  copy(src, path.join(out, item));
}
console.log(`www/ sẵn sàng: ${files} file, ${(bytes / 1048576).toFixed(2)} MB`);
