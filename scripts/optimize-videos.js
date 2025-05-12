import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';
import { glob } from 'glob';
import sharp from 'sharp';

const execAsync = promisify(exec);
const SOURCE_DIR = 'src/assets/videos';
const OUTPUT_DIR = 'public/videos';
const THUMBNAIL_DIR = 'public/thumbnails';

// Video quality presets
const QUALITY_PRESETS = {
    high: {
        mp4: '-c:v libx264 -crf 23 -preset medium -c:a aac -b:a 128k',
        webm: '-c:v libvpx-vp9 -crf 30 -b:v 0 -c:a libopus -b:a 128k'
    },
    medium: {
        mp4: '-c:v libx264 -crf 28 -preset medium -c:a aac -b:a 96k',
        webm: '-c:v libvpx-vp9 -crf 35 -b:v 0 -c:a libopus -b:a 96k'
    },
    low: {
        mp4: '-c:v libx264 -crf 32 -preset medium -c:a aac -b:a 64k',
        webm: '-c:v libvpx-vp9 -crf 40 -b:v 0 -c:a libopus -b:a 64k'
    }
};

// HLS/DASH quality levels
const STREAMING_QUALITIES = [
    { resolution: '1080p', bitrate: '2800k', audioBitrate: '128k' },
    { resolution: '720p', bitrate: '1400k', audioBitrate: '96k' },
    { resolution: '480p', bitrate: '800k', audioBitrate: '64k' },
    { resolution: '360p', bitrate: '400k', audioBitrate: '64k' }
];

const convertToMP4 = async (inputPath, outputPath, quality = 'medium') => {
    try {
        const preset = QUALITY_PRESETS[quality].mp4;
        await execAsync(`ffmpeg -i ${inputPath} ${preset} ${outputPath}`);
        console.log(chalk.green(`✅ Converted to MP4: ${path.basename(inputPath)}`));
    } catch (error) {
        console.error(chalk.red(`❌ Error converting to MP4: ${inputPath}`), error.message);
    }
};

const convertToWebM = async (inputPath, outputPath, quality = 'medium') => {
    try {
        const preset = QUALITY_PRESETS[quality].webm;
        await execAsync(`ffmpeg -i ${inputPath} ${preset} ${outputPath}`);
        console.log(chalk.green(`✅ Converted to WebM: ${path.basename(inputPath)}`));
    } catch (error) {
        console.error(chalk.red(`❌ Error converting to WebM: ${inputPath}`), error.message);
    }
};

const generateHLSStream = async (inputPath, outputDir, baseName) => {
    try {
        const qualities = STREAMING_QUALITIES.map(q =>
            `-vf scale=-2:${q.resolution.split('p')[0]} -c:v libx264 -crf 23 -preset medium -c:a aac -b:a ${q.audioBitrate} -b:v ${q.bitrate}`
        ).join(' ');

        await execAsync(`ffmpeg -i ${inputPath} ${qualities} -f hls -hls_time 10 -hls_list_size 0 -hls_segment_filename "${outputDir}/${baseName}_%03d.ts" "${outputDir}/${baseName}.m3u8"`);
        console.log(chalk.green(`✅ Generated HLS stream: ${baseName}`));
    } catch (error) {
        console.error(chalk.red(`❌ Error generating HLS stream: ${inputPath}`), error.message);
    }
};

const generateDASHManifest = async (inputPath, outputDir, baseName) => {
    try {
        const qualities = STREAMING_QUALITIES.map(q =>
            `-vf scale=-2:${q.resolution.split('p')[0]} -c:v libx264 -crf 23 -preset medium -c:a aac -b:a ${q.audioBitrate} -b:v ${q.bitrate}`
        ).join(' ');

        await execAsync(`ffmpeg -i ${inputPath} ${qualities} -f dash -seg_duration 10 -use_timeline 1 -use_template 1 -init_seg_name "${baseName}_init_$RepresentationID$.m4s" -media_seg_name "${baseName}_chunk_$RepresentationID$_$Number%05d$.m4s" "${outputDir}/${baseName}.mpd"`);
        console.log(chalk.green(`✅ Generated DASH manifest: ${baseName}`));
    } catch (error) {
        console.error(chalk.red(`❌ Error generating DASH manifest: ${inputPath}`), error.message);
    }
};

const generateThumbnail = async (inputPath, outputPath) => {
    try {
        // Extract frame at 10% of video duration
        const { stdout } = await execAsync(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 ${inputPath}`);
        const duration = parseFloat(stdout);
        const timestamp = duration * 0.1;

        await execAsync(`ffmpeg -ss ${timestamp} -i ${inputPath} -vframes 1 -q:v 2 ${outputPath}`);

        // Optimize thumbnail
        await sharp(outputPath)
            .resize(320, 180, { fit: 'cover' })
            .jpeg({ quality: 80 })
            .toFile(outputPath);

        console.log(chalk.green(`✅ Generated thumbnail: ${path.basename(outputPath)}`));
    } catch (error) {
        console.error(chalk.red(`❌ Error generating thumbnail: ${inputPath}`), error.message);
    }
};

const updateVideoReferences = async () => {
    const videoFiles = await glob('src/**/*.{js,jsx,ts,tsx,vue}', {
        ignore: ['**/node_modules/**']
    });

    for (const file of videoFiles) {
        const content = await fs.readFile(file, 'utf-8');
        const videoRegex = /<video[^>]*src=["'](.*\.(?:mp4|webm))["'][^>]*>/g;
        let match;
        let updatedContent = content;

        while ((match = videoRegex.exec(content)) !== null) {
            const videoPath = match[1];
            const videoName = path.basename(videoPath);
            const baseName = path.basename(videoName, path.extname(videoName));

            const videoElement = `
<video
    controls
    preload="metadata"
    poster="/thumbnails/${baseName}.jpg"
>
    <source src="/videos/${baseName}.webm" type="video/webm">
    <source src="/videos/${baseName}.mp4" type="video/mp4">
    <p>Your browser doesn't support HTML5 video. Here is a <a href="/videos/${baseName}.mp4">link to the video</a> instead.</p>
</video>`;

            updatedContent = updatedContent.replace(
                new RegExp(`<video[^>]*src=["']${videoPath}["'][^>]*>`, 'g'),
                videoElement
            );
        }

        if (updatedContent !== content) {
            await fs.writeFile(file, updatedContent);
            console.log(chalk.green(`✅ Updated video references in: ${file}`));
        }
    }
};

const main = async () => {
    try {
        console.log(chalk.blue('🔍 Starting video optimization...'));

        // Create output directories
        await fs.mkdir(OUTPUT_DIR, { recursive: true });
        await fs.mkdir(THUMBNAIL_DIR, { recursive: true });

        // Get all video files
        const videoFiles = await glob(`${SOURCE_DIR}/**/*.{mp4,mov,avi,mkv}`);

        // Process each video
        for (const file of videoFiles) {
            const relativePath = path.relative(SOURCE_DIR, file);
            const baseName = path.basename(relativePath, path.extname(relativePath));

            // Create output paths
            const mp4Path = path.join(OUTPUT_DIR, `${baseName}.mp4`);
            const webmPath = path.join(OUTPUT_DIR, `${baseName}.webm`);
            const thumbnailPath = path.join(THUMBNAIL_DIR, `${baseName}.jpg`);
            const hlsDir = path.join(OUTPUT_DIR, 'hls', baseName);
            const dashDir = path.join(OUTPUT_DIR, 'dash', baseName);

            // Create streaming directories
            await fs.mkdir(hlsDir, { recursive: true });
            await fs.mkdir(dashDir, { recursive: true });

            // Convert formats
            await convertToMP4(file, mp4Path);
            await convertToWebM(file, webmPath);

            // Generate streaming versions
            await generateHLSStream(file, hlsDir, baseName);
            await generateDASHManifest(file, dashDir, baseName);

            // Generate thumbnail
            await generateThumbnail(file, thumbnailPath);
        }

        // Update video references in code
        await updateVideoReferences();

        console.log(chalk.green('\n✅ Video optimization completed successfully!'));
    } catch (error) {
        console.error(chalk.red('❌ Video optimization failed:'), error.message);
        process.exit(1);
    }
};

main(); 