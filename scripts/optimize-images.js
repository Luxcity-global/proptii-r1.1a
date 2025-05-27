import sharp from 'sharp';
import { glob } from 'glob';
import path from 'path';
import fs from 'fs/promises';
import chalk from 'chalk';

const SOURCE_DIR = 'src/assets/images';
const OUTPUT_DIR = 'public/images';
const QUALITY = 80;
const SIZES = [320, 640, 960, 1280, 1920];

const optimizeImage = async (inputPath, outputPath, options = {}) => {
    try {
        const image = sharp(inputPath);
        const metadata = await image.metadata();

        // Generate WebP version
        await image
            .webp({ quality: QUALITY })
            .toFile(outputPath.replace(/\.[^.]+$/, '.webp'));

        // Generate responsive sizes
        for (const size of SIZES) {
            if (metadata.width > size) {
                const sizeOutputPath = outputPath.replace(
                    /(\.[^.]+)$/,
                    `-${size}$1`
                );
                await image
                    .resize(size)
                    .webp({ quality: QUALITY })
                    .toFile(sizeOutputPath.replace(/\.[^.]+$/, '.webp'));
            }
        }

        // Generate fallback JPEG/PNG
        const format = metadata.format === 'png' ? 'png' : 'jpeg';
        await image
            .toFormat(format, { quality: QUALITY })
            .toFile(outputPath);

        console.log(chalk.green(`✅ Optimized: ${path.basename(inputPath)}`));
    } catch (error) {
        console.error(chalk.red(`❌ Error optimizing ${inputPath}:`), error.message);
    }
};

const generateSrcSet = (filename, sizes) => {
    return sizes
        .map(size => `/images/${filename}-${size}.webp ${size}w`)
        .join(', ');
};

const updateImageReferences = async () => {
    const imageFiles = await glob('src/**/*.{js,jsx,ts,tsx,vue}', {
        ignore: ['**/node_modules/**']
    });

    for (const file of imageFiles) {
        const content = await fs.readFile(file, 'utf-8');
        const imageRegex = /import\s+.*\s+from\s+['"](.*\.(?:png|jpg|jpeg|gif))['"]/g;
        let match;
        let updatedContent = content;

        while ((match = imageRegex.exec(content)) !== null) {
            const imagePath = match[1];
            const imageName = path.basename(imagePath);
            const baseName = path.basename(imageName, path.extname(imageName));

            const srcSet = generateSrcSet(baseName, SIZES);
            const pictureElement = `
<picture>
    <source
        srcSet="${srcSet}"
        type="image/webp"
    />
    <img
        src="/images/${baseName}.${path.extname(imageName).slice(1)}"
        alt="${baseName}"
        loading="lazy"
    />
</picture>`;

            updatedContent = updatedContent.replace(
                new RegExp(`<img[^>]*src=["']${imagePath}["'][^>]*>`, 'g'),
                pictureElement
            );
        }

        if (updatedContent !== content) {
            await fs.writeFile(file, updatedContent);
            console.log(chalk.green(`✅ Updated image references in: ${file}`));
        }
    }
};

const main = async () => {
    try {
        console.log(chalk.blue('🔍 Starting image optimization...'));

        // Create output directory if it doesn't exist
        await fs.mkdir(OUTPUT_DIR, { recursive: true });

        // Get all image files
        const imageFiles = await glob(`${SOURCE_DIR}/**/*.{png,jpg,jpeg,gif}`);

        // Process each image
        for (const file of imageFiles) {
            const relativePath = path.relative(SOURCE_DIR, file);
            const outputPath = path.join(OUTPUT_DIR, relativePath);
            await fs.mkdir(path.dirname(outputPath), { recursive: true });
            await optimizeImage(file, outputPath);
        }

        // Update image references in code
        await updateImageReferences();

        console.log(chalk.green('\n✅ Image optimization completed successfully!'));
    } catch (error) {
        console.error(chalk.red('❌ Image optimization failed:'), error.message);
        process.exit(1);
    }
};

main(); 