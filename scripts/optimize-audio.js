import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';
import { glob } from 'glob';

const execAsync = promisify(exec);
const SOURCE_DIR = 'src/assets/audio';
const OUTPUT_DIR = 'public/audio';

// Audio quality presets
const QUALITY_PRESETS = {
    high: {
        mp3: '-c:a libmp3lame -q:a 0 -b:a 320k',
        aac: '-c:a aac -b:a 256k',
        ogg: '-c:a libvorbis -q:a 6'
    },
    medium: {
        mp3: '-c:a libmp3lame -q:a 2 -b:a 192k',
        aac: '-c:a aac -b:a 192k',
        ogg: '-c:a libvorbis -q:a 4'
    },
    low: {
        mp3: '-c:a libmp3lame -q:a 4 -b:a 128k',
        aac: '-c:a aac -b:a 128k',
        ogg: '-c:a libvorbis -q:a 2'
    }
};

const convertToMP3 = async (inputPath, outputPath, quality = 'medium') => {
    try {
        const preset = QUALITY_PRESETS[quality].mp3;
        await execAsync(`ffmpeg -i ${inputPath} ${preset} ${outputPath}`);
        console.log(chalk.green(`✅ Converted to MP3: ${path.basename(inputPath)}`));
    } catch (error) {
        console.error(chalk.red(`❌ Error converting to MP3: ${inputPath}`), error.message);
    }
};

const convertToAAC = async (inputPath, outputPath, quality = 'medium') => {
    try {
        const preset = QUALITY_PRESETS[quality].aac;
        await execAsync(`ffmpeg -i ${inputPath} ${preset} ${outputPath}`);
        console.log(chalk.green(`✅ Converted to AAC: ${path.basename(inputPath)}`));
    } catch (error) {
        console.error(chalk.red(`❌ Error converting to AAC: ${inputPath}`), error.message);
    }
};

const convertToOGG = async (inputPath, outputPath, quality = 'medium') => {
    try {
        const preset = QUALITY_PRESETS[quality].ogg;
        await execAsync(`ffmpeg -i ${inputPath} ${preset} ${outputPath}`);
        console.log(chalk.green(`✅ Converted to OGG: ${path.basename(inputPath)}`));
    } catch (error) {
        console.error(chalk.red(`❌ Error converting to OGG: ${inputPath}`), error.message);
    }
};

const generateAudioMetadata = async (inputPath) => {
    try {
        const { stdout } = await execAsync(`ffprobe -v quiet -print_format json -show_format -show_streams ${inputPath}`);
        const metadata = JSON.parse(stdout);
        return {
            duration: parseFloat(metadata.format.duration),
            bitrate: parseInt(metadata.format.bit_rate),
            sampleRate: parseInt(metadata.streams[0].sample_rate),
            channels: parseInt(metadata.streams[0].channels)
        };
    } catch (error) {
        console.error(chalk.red(`❌ Error getting audio metadata: ${inputPath}`), error.message);
        return null;
    }
};

const updateAudioReferences = async () => {
    const audioFiles = await glob('src/**/*.{js,jsx,ts,tsx,vue}', {
        ignore: ['**/node_modules/**']
    });

    for (const file of audioFiles) {
        const content = await fs.readFile(file, 'utf-8');
        const audioRegex = /<audio[^>]*src=["'](.*\.(?:mp3|aac|ogg))["'][^>]*>/g;
        let match;
        let updatedContent = content;

        while ((match = audioRegex.exec(content)) !== null) {
            const audioPath = match[1];
            const audioName = path.basename(audioPath);
            const baseName = path.basename(audioName, path.extname(audioName));

            const audioElement = `
<audio
    controls
    preload="metadata"
>
    <source src="/audio/${baseName}.ogg" type="audio/ogg">
    <source src="/audio/${baseName}.mp3" type="audio/mpeg">
    <source src="/audio/${baseName}.aac" type="audio/aac">
    <p>Your browser doesn't support HTML5 audio. Here is a <a href="/audio/${baseName}.mp3">link to the audio</a> instead.</p>
</audio>`;

            updatedContent = updatedContent.replace(
                new RegExp(`<audio[^>]*src=["']${audioPath}["'][^>]*>`, 'g'),
                audioElement
            );
        }

        if (updatedContent !== content) {
            await fs.writeFile(file, updatedContent);
            console.log(chalk.green(`✅ Updated audio references in: ${file}`));
        }
    }
};

const generateAudioManifest = async (audioFiles) => {
    const manifest = {
        version: '1.0',
        files: []
    };

    for (const file of audioFiles) {
        const relativePath = path.relative(SOURCE_DIR, file);
        const baseName = path.basename(relativePath, path.extname(relativePath));
        const metadata = await generateAudioMetadata(file);

        if (metadata) {
            manifest.files.push({
                name: baseName,
                formats: {
                    mp3: `/audio/${baseName}.mp3`,
                    aac: `/audio/${baseName}.aac`,
                    ogg: `/audio/${baseName}.ogg`
                },
                metadata: {
                    duration: metadata.duration,
                    bitrate: metadata.bitrate,
                    sampleRate: metadata.sampleRate,
                    channels: metadata.channels
                }
            });
        }
    }

    await fs.writeFile(
        path.join(OUTPUT_DIR, 'audio-manifest.json'),
        JSON.stringify(manifest, null, 2)
    );
    console.log(chalk.green('✅ Generated audio manifest'));
};

const main = async () => {
    try {
        console.log(chalk.blue('🔍 Starting audio optimization...'));

        // Create output directory
        await fs.mkdir(OUTPUT_DIR, { recursive: true });

        // Get all audio files
        const audioFiles = await glob(`${SOURCE_DIR}/**/*.{mp3,wav,aiff,flac}`);

        // Process each audio file
        for (const file of audioFiles) {
            const relativePath = path.relative(SOURCE_DIR, file);
            const baseName = path.basename(relativePath, path.extname(relativePath));

            // Create output paths
            const mp3Path = path.join(OUTPUT_DIR, `${baseName}.mp3`);
            const aacPath = path.join(OUTPUT_DIR, `${baseName}.aac`);
            const oggPath = path.join(OUTPUT_DIR, `${baseName}.ogg`);

            // Convert to different formats
            await convertToMP3(file, mp3Path);
            await convertToAAC(file, aacPath);
            await convertToOGG(file, oggPath);
        }

        // Generate audio manifest
        await generateAudioManifest(audioFiles);

        // Update audio references in code
        await updateAudioReferences();

        console.log(chalk.green('\n✅ Audio optimization completed successfully!'));
    } catch (error) {
        console.error(chalk.red('❌ Audio optimization failed:'), error.message);
        process.exit(1);
    }
};

main(); 