import {
  Controller,
  Post,
  Body,
  HttpCode,
  UseGuards,
  HttpException,
  HttpStatus,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { IsString, IsOptional, ValidateNested, IsDefined } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiTags, ApiOperation, ApiResponse, ApiProperty } from '@nestjs/swagger';
import { AddressThrottleGuard } from '../guards/address-throttle.guard';
import { ReportAssembleService } from '../gov-data/services/report-assemble.service';

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
}

@ApiTags('reports')
@Controller('properties')
export class ReportController {
  constructor(private readonly reportAssemble: ReportAssembleService) {}

  @Post('report')
  @ApiOperation({ summary: 'Stream a Renter Report based on property address' })
  @ApiResponse({ status: 200, description: 'Report stream started' })
  @ApiResponse({ status: 400, description: 'Postcode missing from request' })
  @UseGuards(AddressThrottleGuard)
  async getReport(@Body() dto: ReportRequestDto, @Res() res: Response) {
    console.log('[DEBUG] getReport DTO received:', JSON.stringify(dto, null, 2));
    if (!dto.address?.postcode && dto.address?.coordinates) {
      try {
        const { lat, lng } = dto.address.coordinates;
        // 1. Try resolving exact postcode first
        let pcRes = await fetch(`https://api.postcodes.io/postcodes?lon=${lng}&lat=${lat}`);
        if (pcRes.ok) {
          const pcData = await pcRes.json();
          if (pcData.result && pcData.result.length > 0) {
            dto.address.postcode = pcData.result[0].postcode;
            console.log(`[Geocoding JIT] Resolved full postcode '${dto.address.postcode}' from coordinates [${lat}, ${lng}]`);
          }
        }

        // 2. Fall back to outcodes if full postcode not matched
        if (!dto.address.postcode) {
          const outRes = await fetch(`https://api.postcodes.io/outcodes?lon=${lng}&lat=${lat}`);
          if (outRes.ok) {
            const outData = await outRes.json();
            if (outData.result && outData.result.length > 0) {
              dto.address.postcode = outData.result[0].outcode;
              console.log(`[Geocoding JIT] Resolved outcode '${dto.address.postcode}' from coordinates [${lat}, ${lng}]`);
            }
          }
        }
      } catch (e) {
        console.warn('[Geocoding JIT] postcodes.io fallback failed', e);
      }
    }

    if (!dto.address?.postcode && dto.address?.display) {
      try {
        const apiKey = process.env.GOOGLE_MAPS_API_KEY;
        if (apiKey) {
          const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(dto.address.display)}&key=${apiKey}`);
          if (res.ok) {
            const data = await res.json();
            if (data.results && data.results.length > 0) {
              const postalCodeComponent = data.results[0].address_components.find((c: any) => 
                c.types.includes('postal_code') || c.types.includes('postal_code_prefix')
              );
              if (postalCodeComponent) {
                dto.address.postcode = postalCodeComponent.long_name;
                console.log(`[Geocoding JIT] Derived postcode '${dto.address.postcode}' for address '${dto.address.display}' via Google Geocoding API`);
              }
            }
          }
        }
      } catch (e) {
        console.warn('[Geocoding JIT] Google geocoding fallback failed', e);
      }
    }

    if (!dto.address || !dto.address.postcode) {
      // Degrade gracefully if no postcode is provided
      throw new HttpException('A postcode or valid coordinates is required to generate a report.', HttpStatus.BAD_REQUEST);
    }
    
    // Set headers for chunked NDJSON streaming
    res.setHeader('Content-Type', 'application/x-ndjson');
    res.setHeader('Transfer-Encoding', 'chunked');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Delegate stream generation to the service
    await this.reportAssemble.streamReport(dto, res);
  }
}
