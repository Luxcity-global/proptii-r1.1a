import { Injectable, Logger } from '@nestjs/common';
import sharp from 'sharp';

export interface OptimisedImageVariants {
  thumbnailBuffer: Buffer;
  desktopBuffer: Buffer;
  fullBuffer: Buffer;
  dimensions: {
    width?: number;
    height?: number;
    aspectRatio?: number;
  };
}

@Injectable()
export class ImageOptimiserService {
  private readonly logger = new Logger(ImageOptimiserService.name);

  /**
   * Generates responsive WebP variants (Thumbnail, Desktop, Full) from an image buffer
   */
  async optimiseImage(buffer: Buffer): Promise<OptimisedImageVariants> {
    try {
      const image = sharp(buffer);
      const metadata = await image.metadata();

      const width = metadata.width || 1920;
      const height = metadata.height || 1080;
      const aspectRatio = width && height ? parseFloat((width / height).toFixed(2)) : 1.78;

      // 1. Thumbnail variant (320px width WebP for search cards / pins)
      const thumbnailBuffer = await sharp(buffer)
        .resize({ width: 320, withoutEnlargement: true, fit: 'inside' })
        .webp({ quality: 80 })
        .toBuffer();

      // 2. Desktop gallery variant (1280px width WebP for property details)
      const desktopBuffer = await sharp(buffer)
        .resize({ width: 1280, withoutEnlargement: true, fit: 'inside' })
        .webp({ quality: 85 })
        .toBuffer();

      // 3. Full high-res variant (1920px width WebP for fullscreen lightbox zoom)
      const fullBuffer = await sharp(buffer)
        .resize({ width: 1920, withoutEnlargement: true, fit: 'inside' })
        .webp({ quality: 90 })
        .toBuffer();

      this.logger.log(`[ImageOptimiser] Generated 3 WebP variants (Thumb: ${thumbnailBuffer.length}B, Desktop: ${desktopBuffer.length}B, Full: ${fullBuffer.length}B)`);

      return {
        thumbnailBuffer,
        desktopBuffer,
        fullBuffer,
        dimensions: {
          width,
          height,
          aspectRatio,
        },
      };
    } catch (err: any) {
      this.logger.warn(`[ImageOptimiser] Image optimisation warning: ${err?.message}. Returning original buffer.`);
      return {
        thumbnailBuffer: buffer,
        desktopBuffer: buffer,
        fullBuffer: buffer,
        dimensions: {},
      };
    }
  }
}
