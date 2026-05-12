import { IsString, IsOptional, IsNumber, IsBoolean, IsInt, Min } from 'class-validator';

export class AnalyzeRoutingDto {
  @IsString()
  text: string;

  @IsOptional() @IsString()
  category?: string;

  @IsOptional() @IsString()
  priority?: string;
}

export class CreateRoutingRuleDto {
  @IsString()
  teamId: string;

  @IsString()
  name: string;

  @IsString()
  keywords: string; // JSON array string

  @IsOptional() @IsString()
  semanticDesc?: string;

  @IsOptional() @IsNumber()
  weight?: number;

  @IsOptional() @IsInt() @Min(0)
  priority?: number;
}

export class UpdateRoutingRuleDto {
  @IsOptional() @IsString()
  name?: string;

  @IsOptional() @IsString()
  keywords?: string;

  @IsOptional() @IsString()
  semanticDesc?: string;

  @IsOptional() @IsNumber()
  weight?: number;

  @IsOptional() @IsInt() @Min(0)
  priority?: number;

  @IsOptional() @IsBoolean()
  isActive?: boolean;
}
