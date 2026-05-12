import { IsString, IsOptional } from 'class-validator';

export class ManualEscalateDto {
  @IsString()
  reason: string; // Complexity Exceeds Scope | Employee Dissatisfied | Policy Decision Required | Legal Risk | Sensitive Issue | Other

  @IsOptional() @IsString()
  note?: string;
}
