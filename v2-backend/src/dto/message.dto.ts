import { IsString, IsOptional, IsArray } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class SendMessageDto {
  @ApiPropertyOptional({ description: 'Message body content', example: 'Hello, when is the viewing?' })
  @IsOptional()
  @IsString()
  body?: string;

  @ApiPropertyOptional({ description: 'Alternative message text field for backward compatibility' })
  @IsOptional()
  @IsString()
  text?: string;

  @ApiPropertyOptional({ description: 'Attachment IDs associated with this message', type: [String] })
  @IsOptional()
  @IsArray()
  attachmentIds?: string[];

  @ApiPropertyOptional({ description: 'Sender role (tenant, landlord, agent, guest)', default: 'tenant' })
  @IsOptional()
  @IsString()
  senderRole?: string;
}

export class EditMessageDto {
  @ApiPropertyOptional({ description: 'Updated message content' })
  @IsString()
  body!: string;
}
