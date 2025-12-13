import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function fetchComponent(componentName) {
  return new Promise((resolve, reject) => {
    const url = `https://magicui.design/r/${componentName}.json`;
    
    https.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json);
        } catch (error) {
          reject(new Error(`Failed to parse JSON for ${componentName}: ${error.message}`));
        }
      });
    }).on('error', (error) => {
      reject(new Error(`Failed to fetch ${componentName}: ${error.message}`));
    });
  });
}

async function installBentoGrid() {
  try {
    console.log('Fetching official bento-grid component...');
    const componentData = await fetchComponent('bento-grid');
    
    if (!componentData.files || componentData.files.length === 0) {
      console.log('⚠️  No files found for bento-grid');
      return;
    }
    
    for (const file of componentData.files) {
      // Convert registry path to actual path
      // registry/magicui/bento-grid.tsx -> src/components/ui/bento-grid.tsx
      let filePath = file.path;
      if (filePath.startsWith('registry/magicui/')) {
        filePath = filePath.replace('registry/magicui/', 'src/components/ui/');
      } else if (filePath.startsWith('components/ui/')) {
        filePath = filePath.replace('components/ui/', 'src/components/ui/');
      } else {
        filePath = `src/components/ui/${path.basename(filePath)}`;
      }
      
      const fullPath = path.join(__dirname, '..', filePath);
      const dir = path.dirname(fullPath);
      
      // Create directory if it doesn't exist
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      // Write file (overwrite if exists)
      fs.writeFileSync(fullPath, file.content);
      console.log(`✅ Installed ${filePath}`);
    }
    
    // Check for dependencies
    if (componentData.dependencies && componentData.dependencies.length > 0) {
      console.log(`📦 Dependencies: ${componentData.dependencies.join(', ')}`);
    }
    
    if (componentData.registryDependencies && componentData.registryDependencies.length > 0) {
      console.log(`📦 Registry Dependencies: ${componentData.registryDependencies.join(', ')}`);
    }
  } catch (error) {
    console.error(`❌ Error installing bento-grid:`, error.message);
  }
}

installBentoGrid().catch(console.error);

