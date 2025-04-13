const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const ICON_SIZES = {
  png: [16, 32, 64, 128, 256, 512],
  icns: [16, 32, 64, 128, 256, 512, 1024]
};

async function generateIcons() {
  const sourceIcon = path.join(__dirname, '../electron/assets/icon.svg');
  const outputDir = path.join(__dirname, '../electron/assets');

  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Generate PNG icons
  for (const size of ICON_SIZES.png) {
    await sharp(sourceIcon)
      .resize(size, size)
      .png()
      .toFile(path.join(outputDir, `icon-${size}.png`));
    console.log(`Generated ${size}x${size} PNG icon`);
  }

  // Generate ICNS icon (macOS)
  const icnsPath = path.join(outputDir, 'icon.icns');
  const iconsetPath = path.join(outputDir, 'icon.iconset');

  // Create iconset directory
  if (!fs.existsSync(iconsetPath)) {
    fs.mkdirSync(iconsetPath, { recursive: true });
  }

  // Generate iconset files
  for (const size of ICON_SIZES.icns) {
    const filename = `icon_${size}x${size}${size === 1024 ? '' : '@2x'}.png`;
    await sharp(sourceIcon)
      .resize(size, size)
      .png()
      .toFile(path.join(iconsetPath, filename));
    console.log(`Generated ${filename} for iconset`);
  }

  // Convert iconset to icns using iconutil (macOS only)
  if (process.platform === 'darwin') {
    const { execSync } = require('child_process');
    try {
      execSync(`iconutil -c icns "${iconsetPath}" -o "${icnsPath}"`);
      console.log('Generated ICNS icon');
    } catch (error) {
      console.error('Error generating ICNS:', error);
    }
  }

  console.log('Icon generation complete!');
}

generateIcons().catch(console.error); 