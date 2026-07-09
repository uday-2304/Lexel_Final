const fs = require('fs');
const path = require('path');

function patchLicenseManager() {
  const filesToPatch = [
    'node_modules/@tldraw/editor/dist-esm/lib/license/LicenseManager.mjs',
    'node_modules/@tldraw/editor/dist-cjs/lib/license/LicenseManager.js'
  ];

  let successCount = 0;

  filesToPatch.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
      let content = fs.readFileSync(filePath, 'utf8');
      
      const targetRegex = /getIsDevelopment\(\)\s*\{[\s\S]*?process\.env\.NODE_ENV !== "production";\s*\}/;
      const replacement = 'getIsDevelopment() {\n    return true;\n  }';
      
      if (targetRegex.test(content)) {
        content = content.replace(targetRegex, replacement);
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Patched ${file}`);
        successCount++;
      } else {
        console.log(`Could not find target regex in ${file}`);
      }
    } else {
      console.log(`File not found: ${file}`);
    }
  });

  if (successCount === 0) {
    console.error("Failed to patch Tldraw DRM checks.");
  }
}

patchLicenseManager();
