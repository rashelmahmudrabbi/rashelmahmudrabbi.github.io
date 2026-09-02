const fs = require('fs');
let c = fs.readFileSync('index.html', 'utf8');
const start = c.indexOf('    <section id="gallery"');
const end = c.indexOf('    <!-- REFERENCES -->');
if (start !== -1 && end !== -1) {
  c = c.substring(0, start) + c.substring(end);
  fs.writeFileSync('index.html', c);
  console.log('Removed gallery');
} else {
  console.log('Could not find boundaries');
}
