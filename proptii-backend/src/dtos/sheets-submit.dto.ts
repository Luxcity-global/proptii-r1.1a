import { IsObject, IsString, IsNotEmpty } from 'class-validator';

/**
 * DTO for `POST /api/sheets/submit`.
 *
 * The `data` payload is intentionally flexible because the SheetsService
 * supports multiple shapes (help form vs review form). We only validate that
 * it's an object, not `any`.
 */
export class SubmitSheetsDto {
  @IsString()
  @IsNotEmpty()
  spreadsheetId!: string;

  @IsObject()
  data!: Record<string, unknown>;
}

