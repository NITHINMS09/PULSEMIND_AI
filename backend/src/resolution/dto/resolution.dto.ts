import { IsString, IsOptional, IsInt, Min, Max } from 'class-validator';

export class SubmitSolutionDto {
  @IsString()
  solution: string;

  @IsOptional() @IsString()
  note?: string;
}

export class ConfirmResolutionDto {
  @IsString()
  decision: string; // ACCEPTED | REJECTED | FURTHER_HELP

  @IsOptional() @IsInt() @Min(1) @Max(5)
  satisfactionRating?: number;

  @IsOptional() @IsString()
  professionalismRating?: string; // YES | SOMEWHAT | NO

  @IsOptional() @IsString()
  comment?: string;

  @IsOptional() @IsString()
  reopenReason?: string;
}
