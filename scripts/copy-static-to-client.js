const fs = require('fs');
const path = require('path');

function copyRecursiveSync(src, dest) {
  if (!fs.existsSync(src)) return;
  const stats = fs.statSync(src);
  if (stats.isDirectory()) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src)) {
      copyRecursiveSync(path.join(src, entry), path.join(dest, entry));
    }
  } else {
    // ensure parent dir exists
    const parent = path.dirname(dest);
    if (!fs.existsSync(parent)) fs.mkdirSync(parent, { recursive: true });
    fs.copyFileSync(src, dest);
  }
}

(function main() {
  const repoStatic = path.join(__dirname, '..', 'static');
  const clientPublicStatic = path.join(__dirname, '..', 'client', 'public', 'static');

  console.log('Copying', repoStatic, '->', clientPublicStatic);
  copyRecursiveSync(repoStatic, clientPublicStatic);
  console.log('Done.');
})();
