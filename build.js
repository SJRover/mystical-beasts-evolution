const fs = require('fs');
const path = require('path');

const files = ['index.html', 'style.css', 'game.js', 'beasts.js', 'audio.js', 'particles.js', 'icon.png'];
const destDir = path.join(__dirname, 'www');

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

files.forEach(file => {
  const src = path.join(__dirname, file);
  const dest = path.join(destDir, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`Copied ${file} to www/`);
  } else {
    console.warn(`Warning: source file ${file} not found.`);
  }
});
console.log('Build complete: Web assets synchronized to www/');
