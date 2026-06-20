const fs = require('fs');
const path = require('path');

const destDir = path.join(__dirname, 'www');

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

const files = fs.readdirSync(__dirname).filter(file => {
  const ext = path.extname(file).toLowerCase();
  return ['.html', '.css', '.js', '.png', '.mp3'].includes(ext) && file !== 'build.js' && file !== 'generate_native_icon.js';
});

files.forEach(file => {
  const src = path.join(__dirname, file);
  const dest = path.join(destDir, file);
  fs.copyFileSync(src, dest);
  console.log(`Copied ${file} to www/`);
});
console.log('Build complete: Web assets synchronized to www/');
