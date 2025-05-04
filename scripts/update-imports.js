const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Map of directory names to their aliases
const aliasMap = {
  'components': '@components',
  'screens': '@screens',
  'features': '@features',
  'contexts': '@contexts',
  'hooks': '@hooks',
  'services': '@services',
  'theme': '@theme',
  'types': '@types',
  'utils': '@utils',
  'lib': '@lib',
  'config': '@config',
  'constants': '@constants',
  'navigation': '@navigation'
};

// Function to update imports in a file
function updateImports(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let updated = false;

  // Replace relative imports with aliased imports
  Object.entries(aliasMap).forEach(([dir, alias]) => {
    const regex = new RegExp(`from ['"]\\.{1,2}/.*?${dir}/`, 'g');
    const newContent = content.replace(regex, (match) => {
      updated = true;
      return match.replace(/\.{1,2}\/.*?(components|screens|features|contexts|hooks|services|theme|types|utils|lib|config|constants|navigation)\//, `${alias}/`);
    });
    content = newContent;
  });

  // If any updates were made, write the file
  if (updated) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated imports in ${filePath}`);
  }
}

// Find all TypeScript files in src directory
const files = glob.sync('src/**/*.{ts,tsx}', { ignore: ['**/node_modules/**', '**/__tests__/**'] });

// Update imports in each file
files.forEach(updateImports);

console.log('Import update complete!'); 