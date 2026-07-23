// Run this ONCE with: node public/copy-bg.js
// It copies the hostel background image into the public folder
const fs = require('fs');
const path = require('path');

const src = 'C:/Users/isaac/.gemini/antigravity-ide/brain/94fac496-0cbd-4570-bb65-a7fa41aa648e/media__1784811749433.jpg';
const dest = path.join(__dirname, 'hostel-bg.jpg');

fs.copyFileSync(src, dest);
console.log('✅ hostel-bg.jpg (new building) copied to public/ folder successfully!');
