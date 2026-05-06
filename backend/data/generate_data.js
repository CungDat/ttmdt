const fs = require('fs');
const path = require('path');

const basePath = 'C:/Users/Lenovo/.gemini/antigravity/brain/fb4aef06-d74d-4e28-9b70-a8666b2a3e25/.system_generated/steps';

function parseCollection(stepNum) {
  const raw = fs.readFileSync(path.join(basePath, String(stepNum), 'content.md'), 'utf8');
  const jsonStr = raw.split('---')[1].trim();
  return JSON.parse(jsonStr).products;
}

function formatImageUrl(src) {
  return src.replace(/\\/g, '');
}

// Parse shafts
const shafts = parseCollection(187);
const shaftItems = shafts.map((p, i) => ({
  name: p.title,
  image: p.images[0] ? formatImageUrl(p.images[0].src) : '',
  images: p.images.map(img => formatImageUrl(img.src)),
  price: parseFloat(p.variants[0]?.price || '0'),
  currencySymbol: '$',
  link: '/',
  isActive: true,
  order: i + 1
}));

// Parse cases
const cases = parseCollection(188);
const caseItems = cases.map((p, i) => ({
  name: p.title,
  image: p.images[0] ? formatImageUrl(p.images[0].src) : '',
  images: p.images.map(img => formatImageUrl(img.src)),
  price: parseFloat(p.variants[0]?.price || '0'),
  currencySymbol: '$',
  link: '/',
  isActive: true,
  order: i + 1
}));

// Parse accessories
const accessories = parseCollection(189);
const accessoryItems = accessories.map((p, i) => ({
  name: p.title,
  image: p.images[0] ? formatImageUrl(p.images[0].src) : '',
  images: p.images.map(img => formatImageUrl(img.src)),
  price: parseFloat(p.variants[0]?.price || '0'),
  currencySymbol: '$',
  link: '/',
  isActive: true,
  order: i + 1
}));

console.log(`Shafts: ${shaftItems.length}`);
console.log(`Cases: ${caseItems.length}`);
console.log(`Accessories: ${accessoryItems.length}`);

// Write shafts
fs.writeFileSync(path.join(__dirname, 'shaftLines.js'),
`const shaftLines = ${JSON.stringify(shaftItems, null, 2)};

module.exports = shaftLines;
`);

// Write cases
fs.writeFileSync(path.join(__dirname, 'caseLines.js'),
`const caseLines = ${JSON.stringify(caseItems, null, 2)};

module.exports = caseLines;
`);

// Write accessories
fs.writeFileSync(path.join(__dirname, 'accessoryLines.js'),
`const accessoryLines = ${JSON.stringify(accessoryItems, null, 2)};

module.exports = accessoryLines;
`);

// Write tables (manual data since API returned 0)
const tableItems = [
  {
    name: 'Predator Apex 9ft Pool Table',
    image: 'https://int.predatorcues.com/cdn/shop/files/Predator-Apex-9-FT-pool-table-quartz-cloth-quartz-quartz-quartz-quartz-quartz-quartz-quartz.webp?v=1774038229&width=1600',
    images: ['https://int.predatorcues.com/cdn/shop/files/Predator-Apex-9-FT-pool-table-quartz-cloth-quartz-quartz-quartz-quartz-quartz-quartz-quartz.webp?v=1774038229&width=1600'],
    price: 7999,
    currencySymbol: '$',
    link: '/',
    isActive: true,
    order: 1
  },
  {
    name: 'Predator Apex 7ft Coin-Op Pool Table',
    image: 'https://int.predatorcues.com/cdn/shop/files/Predator-Apex-7-FT-pool-table-quartz-cloth-quartz-quartz-quartz-quartz-quartz-quartz-quartz.webp?v=1774038230&width=1600',
    images: ['https://int.predatorcues.com/cdn/shop/files/Predator-Apex-7-FT-pool-table-quartz-cloth-quartz-quartz-quartz-quartz-quartz-quartz-quartz.webp?v=1774038230&width=1600'],
    price: 6999,
    currencySymbol: '$',
    link: '/',
    isActive: true,
    order: 2
  },
  {
    name: 'Predator Arc Pool Table',
    image: 'https://int.predatorcues.com/cdn/shop/files/Predator-ARC-pool-table.webp?v=1774038228&width=1600',
    images: ['https://int.predatorcues.com/cdn/shop/files/Predator-ARC-pool-table.webp?v=1774038228&width=1600'],
    price: 12999,
    currencySymbol: '$',
    link: '/',
    isActive: true,
    order: 3
  },
  {
    name: 'Predator Revolution Pool Table',
    image: 'https://int.predatorcues.com/cdn/shop/files/REVOLUTION_1_39e5bee5-5a7d-4a57-9ff3-ac2ca1c781e0.webp?v=1774038231&width=1600',
    images: ['https://int.predatorcues.com/cdn/shop/files/REVOLUTION_1_39e5bee5-5a7d-4a57-9ff3-ac2ca1c781e0.webp?v=1774038231&width=1600'],
    price: 5999,
    currencySymbol: '$',
    link: '/',
    isActive: true,
    order: 4
  }
];

fs.writeFileSync(path.join(__dirname, 'tableLines.js'),
`const tableLines = ${JSON.stringify(tableItems, null, 2)};

module.exports = tableLines;
`);

console.log(`Tables: ${tableItems.length}`);
console.log('All data files generated!');
