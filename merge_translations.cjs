const fs = require('fs');
const path = require('path');

// Deep merge function
function deepMerge(target, source) {
  const output = { ...target };
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          output[key] = source[key];
        } else {
          output[key] = deepMerge(target[key], source[key]);
        }
      } else {
        output[key] = source[key];
      }
    });
  }
  return output;
}

function isObject(item) {
  return item && typeof item === 'object' && !Array.isArray(item);
}

// Read existing translations
const enPath = path.join(__dirname, 'src/locales/en.json');
const frPath = path.join(__dirname, 'src/locales/fr.json');
const missingEnPath = path.join(__dirname, 'src/locales/missing_translations_en.json');
const missingFrPath = path.join(__dirname, 'src/locales/missing_translations_fr.json');

const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const fr = JSON.parse(fs.readFileSync(frPath, 'utf8'));
const missingEn = JSON.parse(fs.readFileSync(missingEnPath, 'utf8'));
const missingFr = JSON.parse(fs.readFileSync(missingFrPath, 'utf8'));

// Merge missing translations
const mergedEn = deepMerge(en, missingEn);
const mergedFr = deepMerge(fr, missingFr);

// Write back to files
fs.writeFileSync(enPath, JSON.stringify(mergedEn, null, 2), 'utf8');
fs.writeFileSync(frPath, JSON.stringify(mergedFr, null, 2), 'utf8');

console.log('✅ Translations merged successfully!');
console.log(`📝 English translations: ${Object.keys(flattenObject(mergedEn)).length} keys`);
console.log(`📝 French translations: ${Object.keys(flattenObject(mergedFr)).length} keys`);

// Helper to count all keys
function flattenObject(obj, prefix = '') {
  let flattened = {};
  for (const key in obj) {
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      Object.assign(flattened, flattenObject(obj[key], prefix + key + '.'));
    } else {
      flattened[prefix + key] = obj[key];
    }
  }
  return flattened;
}
