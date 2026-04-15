// backend/data/products.js
const products = [
  {
    name: 'Gậy Mezz EC9-WKK',
    image: 'https://bida123.vn/wp-content/uploads/2023/04/Mezz-EC9-B-ngon-WX-%CE%A3-Sigma.png',
    images: [
      'https://bida123.vn/wp-content/uploads/2023/04/Mezz-EC9-B-ngon-WX-%CE%A3-Sigma.png',
      'https://bida123.vn/wp-content/uploads/2023/04/Mezz-EC9-2.png',
      'https://bida123.vn/wp-content/uploads/2023/04/Mezz-EC9-3.png',
      'https://bida123.vn/wp-content/uploads/2023/04/Mezz-EC9-4.png'
    ],
    brand: 'Mezz',
    price: 15500000,
    category: 'Playing Cue',
    description: 'Dòng gậy cao cấp từ Nhật Bản',
    specs: {
        joint: 'United Joint',
        shaft: 'WX-Sigma',
        tip: 'Kamui Original S',
        weight: '19oz'
    },
    countInStock: 5
  },
  {
    name: 'Gậy Predator Sport 2 Ice',
    image: 'https://bida123.vn/wp-content/uploads/2021/04/Predator-Sport-2-ICE-Pool-Leather-Wrap-Can-Co-1.png',
    images: [
      'https://bida123.vn/wp-content/uploads/2021/04/Predator-Sport-2-ICE-Pool-Leather-Wrap-Can-Co-1.png',
      'https://bida123.vn/wp-content/uploads/2021/04/Predator-Sport-2-ICE-Pool-Leather-Wrap-Can-Co-2.png',
      'https://bida123.vn/wp-content/uploads/2021/04/Predator-Sport-2-ICE-Pool-Leather-Wrap-Can-Co-3.png',
      'https://bida123.vn/wp-content/uploads/2021/04/Predator-Sport-2-ICE-Pool-Leather-Wrap-Can-Co-4.png'
    ],
    brand: 'Predator',
    price: 12000000,
    category: 'Playing Cue',
    description: 'Thiết kế thể thao, cảm giác đánh chắc chắn',
    specs: {
        joint: 'Uni-Loc',
        shaft: '314-3',
        tip: 'Victory Tip',
        weight: '19oz'
    },
    countInStock: 3
  }
];

module.exports = products;