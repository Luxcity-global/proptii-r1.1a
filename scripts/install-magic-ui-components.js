import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// List of all Magic UI components
const components = [
  'android',
  'warp-background',
  'line-shadow-text',
  'morphing-text',
  'scroll-progress',
  'lens',
  'pointer',
  'smooth-cursor',
  'progressive-blur',
  'neon-gradient-card',
  'meteors',
  'grid-pattern',
  'striped-pattern',
  'interactive-grid-pattern',
  'flickering-grid',
  'hero-video-dialog',
  'code-comparison',
  'globe',
  'tweet-card',
  'client-tweet-card',
  'particles',
  'number-ticker',
  'ripple',
  'retro-grid',
  'animated-shiny-text',
  'animated-beam',
  'hyper-text',
  'orbiting-circles',
  'dock',
  'word-rotate',
  'avatar-circles',
  'typing-animation',
  'sparkles-text',
  'spinning-text',
  'comic-text',
  'icon-cloud',
  'scroll-based-velocity',
  'shiny-button',
  'animated-circular-progress-bar',
  'confetti',
  'cool-mode',
  'pulsating-button',
  'ripple-button',
  'file-tree',
  'blur-fade',
  'safari',
  'iphone',
  'rainbow-button',
  'terminal',
  'video-text',
  'pixel-image',
  'highlighter',
  'animated-theme-toggler',
  'dotted-map'
];

// Components already installed (check existing files)
const existingComponents = [
  'animated-gradient-text',
  'animated-grid-pattern',
  'animated-list',
  'aurora-text',
  'bento-grid',
  'border-beam',
  'dot-pattern',
  'interactive-hover-button',
  'light-rays',
  'magic-card',
  'marquee',
  'shimmer-button',
  'shine-border',
  'text-animate',
  'text-highlighter',
  'text-reveal'
];

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

async function installComponent(componentName) {
  try {
    console.log(`Fetching ${componentName}...`);
    const componentData = await fetchComponent(componentName);
    
    if (!componentData.files || componentData.files.length === 0) {
      console.log(`  ⚠️  No files found for ${componentName}`);
      return;
    }
    
    for (const file of componentData.files) {
      // Convert registry path to actual path
      // registry/magicui/globe.tsx -> src/components/ui/globe.tsx
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
      
      // Check if file already exists
      if (fs.existsSync(fullPath)) {
        console.log(`  ⏭️  Skipping ${filePath} (already exists)`);
        continue;
      }
      
      // Write file
      fs.writeFileSync(fullPath, file.content);
      console.log(`  ✅ Installed ${filePath}`);
    }
    
    // Check for dependencies
    if (componentData.dependencies && componentData.dependencies.length > 0) {
      console.log(`  📦 Dependencies: ${componentData.dependencies.join(', ')}`);
    }
  } catch (error) {
    console.error(`  ❌ Error installing ${componentName}:`, error.message);
  }
}

async function installAllComponents() {
  console.log('Installing Magic UI components...\n');
  
  // Filter out already installed components
  const componentsToInstall = components.filter(
    comp => !existingComponents.includes(comp)
  );
  
  console.log(`Found ${componentsToInstall.length} components to install\n`);
  
  for (const component of componentsToInstall) {
    await installComponent(component);
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('\n✅ Installation complete!');
}

installAllComponents().catch(console.error);


