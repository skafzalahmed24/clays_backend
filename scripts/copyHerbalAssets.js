const fs = require('fs');
const path = require('path');

const brainDir = 'C:\\Users\\skafz\\.gemini\\antigravity-ide\\brain\\e88b9678-56a6-47fe-b403-b695a027ffe9';
const assetsDir = path.join(__dirname, '../../frontned/src/assets');

const files = fs.readdirSync(brainDir);

const img1 = files.find(f => f.startsWith('herbal_hair_oil_banner'));
const img2 = files.find(f => f.startsWith('hair_care_catalog_banner'));
const img3 = files.find(f => f.startsWith('herbal_heritage_story'));

if (img1) {
    fs.copyFileSync(path.join(brainDir, img1), path.join(assetsDir, 'hero.png'));
    console.log(`✓ Copied ${img1} to hero.png`);
}

if (img2) {
    fs.copyFileSync(path.join(brainDir, img2), path.join(assetsDir, 'hero-2.png'));
    console.log(`✓ Copied ${img2} to hero-2.png`);
}

if (img3) {
    fs.copyFileSync(path.join(brainDir, img3), path.join(assetsDir, 'hero-3.png'));
    fs.copyFileSync(path.join(brainDir, img3), path.join(assetsDir, 'story.png'));
    console.log(`✓ Copied ${img3} to hero-3.png and story.png`);
}

console.log('All herbal hair care assets copied successfully!');
