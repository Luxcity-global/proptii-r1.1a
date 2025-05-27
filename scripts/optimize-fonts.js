import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';
import glob from 'glob';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const SOURCE_DIR = 'src/assets/fonts';
const OUTPUT_DIR = 'public/fonts';

const convertToWoff2 = async (inputPath, outputPath) => {
    try {
        // Using Google's woff2_compress tool
        await execAsync(`woff2_compress ${inputPath}`);
        const woff2Path = inputPath.replace(/\.[^.]+$/, '.woff2');
        await fs.rename(woff2Path, outputPath);
        console.log(chalk.green(`✅ Converted to WOFF2: ${path.basename(inputPath)}`));
    } catch (error) {
        console.error(chalk.red(`❌ Error converting ${inputPath}:`), error.message);
    }
};

const generateFontFace = (fontFamily, fontPath, fontWeight, fontStyle = 'normal') => {
    const fontName = path.basename(fontPath, path.extname(fontPath));
    return `
@font-face {
    font-family: '${fontFamily}';
    src: url('${fontPath}') format('woff2');
    font-weight: ${fontWeight};
    font-style: ${fontStyle};
    font-display: swap;
}`;
};

const updateFontReferences = async () => {
    const cssFiles = await glob('src/**/*.{css,scss}', {
        ignore: ['**/node_modules/**']
    });

    for (const file of cssFiles) {
        const content = await fs.readFile(file, 'utf-8');
        const fontRegex = /@font-face\s*{[^}]*}/g;
        let updatedContent = content;

        // Remove existing @font-face declarations
        updatedContent = updatedContent.replace(fontRegex, '');

        // Add new optimized @font-face declarations
        const fontFiles = await glob(`${OUTPUT_DIR}/**/*.woff2`);
        for (const fontFile of fontFiles) {
            const relativePath = path.relative('public', fontFile);
            const fontFamily = path.basename(fontFile, '.woff2').split('-')[0];
            const fontWeight = path.basename(fontFile, '.woff2').split('-')[1] || '400';
            
            updatedContent += generateFontFace(fontFamily, relativePath, fontWeight);
        }

        if (updatedContent !== content) {
            await fs.writeFile(file, updatedContent);
            console.log(chalk.green(`✅ Updated font references in: ${file}`));
        }
    }
};

const addFontPreload = async () => {
    const htmlFiles = await glob('src/**/*.{html,vue}', {
        ignore: ['**/node_modules/**']
    });

    for (const file of htmlFiles) {
        const content = await fs.readFile(file, 'utf-8');
        const fontFiles = await glob(`${OUTPUT_DIR}/**/*.woff2`);
        let updatedContent = content;

        // Remove existing preload links
        updatedContent = updatedContent.replace(
            /<link[^>]*rel="preload"[^>]*as="font"[^>]*>/g,
            ''
        );

        // Add new preload links
        const preloadLinks = fontFiles
            .map(fontFile => {
                const relativePath = path.relative('public', fontFile);
                return `<link rel="preload" href="/${relativePath}" as="font" type="font/woff2" crossorigin>`;
            })
            .join('\n    ');

        // Insert preload links in the head
        updatedContent = updatedContent.replace(
            /<head>/,
            `<head>\n    ${preloadLinks}`
        );

        if (updatedContent !== content) {
            await fs.writeFile(file, updatedContent);
            console.log(chalk.green(`✅ Added font preload links to: ${file}`));
        }
    }
};

const main = async () => {
    try {
        console.log(chalk.blue('🔍 Starting font optimization...'));

        // Create output directory if it doesn't exist
        await fs.mkdir(OUTPUT_DIR, { recursive: true });

        // Get all font files
        const fontFiles = await glob(`${SOURCE_DIR}/**/*.{ttf,otf}`);

        // Process each font
        for (const file of fontFiles) {
            const relativePath = path.relative(SOURCE_DIR, file);
            const outputPath = path.join(OUTPUT_DIR, relativePath.replace(/\.[^.]+$/, '.woff2'));
            await fs.mkdir(path.dirname(outputPath), { recursive: true });
            await convertToWoff2(file, outputPath);
        }

        // Update font references in CSS
        await updateFontReferences();

        // Add font preload links
        await addFontPreload();

        console.log(chalk.green('\n✅ Font optimization completed successfully!'));
    } catch (error) {
        console.error(chalk.red('❌ Font optimization failed:'), error.message);
        process.exit(1);
    }
};

main(); 