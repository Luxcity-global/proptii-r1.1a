import { IsString, IsNotEmpty, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum SearchType {
  PROPERTIES = 'properties',
  SUGGESTIONS = 'suggestions',
}

export class SearchDto {
  @ApiProperty({
    description: 'The search query',
    example: '2 bedroom flat in London',
  })
  @IsString()
  @IsNotEmpty()
  query: string;

  @ApiProperty({
    description: 'The type of search to perform',
    enum: SearchType,
    example: SearchType.PROPERTIES,
  })
  @IsEnum(SearchType)
  type: SearchType;
} 