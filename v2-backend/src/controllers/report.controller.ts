import {
  Controller,
  Post,
  Body,
  HttpCode,
  UseGuards,
  HttpException,
  HttpStatus,
  Res,
  Optional,
} from '@nestjs/common';
import { Response } from 'express';
import { IsString, IsOptional, ValidateNested, IsDefined } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiTags, ApiOperation, ApiResponse, ApiProperty } from '@nestjs/swagger';
import { AddressThrottleGuard } from '../guards/address-throttle.guard';
import { ReportAssembleService } from '../gov-data/services/report-assemble.service';
import { EventsService } from '../services/events.service';
import { getRedisClient } from '../utils/redis-client';

export class CoordinatesDto {
  @ApiProperty({ description: 'Latitude' })
  @IsDefined()
  lat: number;

  @ApiProperty({ description: 'Longitude' })
  @IsDefined()
  lng: number;
}

export class ReportAddressDto {
  @ApiProperty({ description: 'The full display address from the listing' })
  @IsString()
  display: string;

  @ApiProperty({ required: false, description: 'The street line if available' })
  @IsOptional()
  @IsString()
  street?: string | null;

  @ApiProperty({ required: false, description: 'The property postcode' })
  @IsOptional()
  @IsString()
  postcode?: string | null;

  @ApiProperty({ required: false, description: 'The coordinates (lat, lng)' })
  @IsOptional()
  @ValidateNested()
  @Type(() => CoordinatesDto)
  coordinates?: CoordinatesDto;
}

export class ReportRequestDto {
  @ApiProperty({ description: 'The unique ID of the listing' })
  @IsString()
  listingId: string;

  @ApiProperty({ description: 'The address object of the listing' })
  @IsDefined()
  @ValidateNested()
  @Type(() => ReportAddressDto)
  address: ReportAddressDto;

  @ApiProperty({ required: false, description: 'The asking price / rent from the listing' })
  @IsOptional()
  @IsString()
  listingPrice?: string;

  @ApiProperty({ required: false, description: 'Alternative alias for asking price / rent' })
  @IsOptional()
  @IsString()
  rent?: string;

  @ApiProperty({ required: false, description: 'Target user ID to notify on completion' })
  @IsOptional()
  @IsString()
  userId?: string;
}

@ApiTags('reports')
@Controller('properties')
export class ReportController {
  constructor(
    private readonly reportAssemble: ReportAssembleService,
    @Optional() private readonly eventsService?: EventsService,
  ) {}

  /**
   * Helper to resolve genuine UK postcode / coordinates
   */
  private async resolveAddress(dto: ReportRequestDto): Promise<void> {
    if (dto.address?.postcode && !dto.address.postcode.trim()) {
      dto.address.postcode = undefined;
    }

    if (!dto.address?.postcode && dto.address?.display) {
      const FULL_POSTCODE_REGEX = /([Gg][Ii][Rr]\s*0[Aa]{2})|((([A-Za-z]\d{1,2})|(([A-Za-z][A-Ha-hJ-Yj-y]\d{1,2})|(([A-Za-z]\d[A-Za-z])|([A-Za-z][A-Ha-hJ-Yj-y]\d[A-Za-z]?))))\s*\d[A-Za-z]{2})/i;
      const OUTCODE_REGEX = /\b([A-Z]{1,2}\d[A-Z\d]?)\b/i;
      const match = dto.address.display.match(FULL_POSTCODE_REGEX) || dto.address.display.match(OUTCODE_REGEX);
      if (match) {
        dto.address.postcode = match[0].trim();
        console.log(`[Geocoding JIT] Extracted UK postcode/outcode '${dto.address.postcode}' from display text '${dto.address.display}'`);
      }
    }

    if (!dto.address?.postcode && dto.address?.coordinates) {
      try {
        const { lat, lng } = dto.address.coordinates;
        const pcRes = await fetch(`https://api.postcodes.io/postcodes?lon=${lng}&lat=${lat}`);
        if (pcRes.ok) {
          const pcData = await pcRes.json();
          if (pcData.result && pcData.result.length > 0) {
            dto.address.postcode = pcData.result[0].postcode;
          }
        }
      } catch (e) {
        console.warn('[Geocoding JIT] postcodes.io fallback failed', e);
      }
    }

    if (!dto.address?.postcode && (!dto.address?.coordinates?.lat || !dto.address?.coordinates?.lng)) {
      throw new HttpException(
        'Unable to resolve a genuine UK location or postcode for the provided address.',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('report')
  @ApiOperation({ summary: 'Stream a Renter Report with 24-hour Redis caching (Task p4-6)' })
  @ApiResponse({ status: 200, description: 'Report stream started' })
  @ApiResponse({ status: 400, description: 'Postcode missing from request' })
  @UseGuards(AddressThrottleGuard)
  async getReport(@Body() dto: ReportRequestDto, @Res() res: Response) {
    await this.resolveAddress(dto);

    // ── Task p4-6: Check 24-hour Redis cache ────────────────────────────────
    const redis = getRedisClient();
    const cacheKey = `report:${dto.listingId || dto.address.postcode}`;
    if (redis) {
      try {
        const cachedRaw = await redis.get(cacheKey);
        if (cachedRaw) {
          console.log(`[ReportController] Redis Cache Hit (24h) for ${cacheKey}`);
          res.setHeader('Content-Type', 'application/x-ndjson');
          res.setHeader('Cache-Control', 'public, max-age=86400');
          res.write(JSON.stringify({ type: 'initial', cached: true, source: 'redis', data: JSON.parse(cachedRaw) }) + '\n');
          res.write(JSON.stringify({ type: 'done', cached: true }) + '\n');
          return res.end();
        }
      } catch (redisErr: any) {
        console.warn(`[ReportController] Redis cache read failed: ${redisErr?.message}`);
      }
    }

    // Set headers for chunked NDJSON streaming
    res.setHeader('Content-Type', 'application/x-ndjson');
    res.setHeader('Transfer-Encoding', 'chunked');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Intercept writes to cache report in Redis for 24 hours (86,400 seconds)
    const chunks: string[] = [];
    const origWrite = res.write.bind(res);
    res.write = (chunk: any, ...args: any[]) => {
      chunks.push(chunk.toString());
      return origWrite(chunk, ...args);
    };

    const origEnd = res.end.bind(res);
    res.end = (...args: any[]) => {
      if (redis && chunks.length > 0) {
        try {
          const reportSummary = {
            listingId: dto.listingId,
            postcode: dto.address.postcode,
            generatedAt: new Date().toISOString(),
            chunks,
          };
          redis.set(cacheKey, JSON.stringify(reportSummary), 'EX', 86400).catch(() => {});
        } catch {}
      }
      return origEnd(...args);
    };

    await this.reportAssemble.streamReport(dto, res);
  }

  /**
   * Task p4-6: Queue report generation in background job and notify via SSE report_ready event
   */
  @Post('report/queue')
  @HttpCode(202)
  @ApiOperation({ summary: 'Queue background property report generation (Task p4-6)' })
  @ApiResponse({ status: 202, description: 'Report generation queued in background' })
  async queueReport(@Body() dto: ReportRequestDto) {
    await this.resolveAddress(dto);

    const jobId = `report_job_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const cacheKey = `report:${dto.listingId || dto.address.postcode}`;

    // Execute generation in background
    setImmediate(async () => {
      try {
        console.log(`[ReportController] Background job ${jobId} started for listing ${dto.listingId}`);
        const dummyRes: any = {
          write: () => true,
          end: () => true,
          setHeader: () => {},
        };

        await this.reportAssemble.streamReport(dto, dummyRes);

        // Cache completed status in Redis for 24 hours
        const redis = getRedisClient();
        if (redis) {
          await redis.set(
            cacheKey,
            JSON.stringify({
              listingId: dto.listingId,
              postcode: dto.address.postcode,
              status: 'ready',
              generatedAt: new Date().toISOString(),
            }),
            'EX',
            86400,
          );
        }

        // Notify client with report_ready event
        if (this.eventsService) {
          this.eventsService.emit({
            type: 'report_ready',
            userId: dto.userId,
            data: {
              jobId,
              listingId: dto.listingId,
              postcode: dto.address.postcode,
              readyAt: new Date().toISOString(),
            },
          });
        }
        console.log(`[ReportController] Background job ${jobId} completed. report_ready dispatched.`);
      } catch (err: any) {
        console.error(`[ReportController] Background report generation failed for ${dto.listingId}:`, err);
      }
    });

    return {
      status: 'queued',
      jobId,
      listingId: dto.listingId,
      message: 'Report is generating in background. You will receive a report_ready notification.',
    };
  }
}
