import { IsString, IsOptional, IsInt, IsBoolean, Min } from 'class-validator';

export class CreateTeamDto {
  @IsString()
  name: string;

  @IsString()
  type: string; // TECHNICAL | HR | SERVICE | INFRASTRUCTURE | MANAGEMENT | GENERAL

  @IsString()
  organizationId: string;

  @IsOptional() @IsString()
  leadId?: string;

  @IsOptional() @IsInt() @Min(1)
  maxCapacity?: number;

  @IsOptional() @IsString()
  operatingHoursStart?: string;

  @IsOptional() @IsString()
  operatingHoursEnd?: string;

  @IsOptional() @IsString()
  timezone?: string;
}

export class UpdateTeamDto {
  @IsOptional() @IsString()
  name?: string;

  @IsOptional() @IsString()
  type?: string;

  @IsOptional() @IsString()
  leadId?: string;

  @IsOptional() @IsInt() @Min(1)
  maxCapacity?: number;

  @IsOptional() @IsBoolean()
  isActive?: boolean;

  @IsOptional() @IsString()
  operatingHoursStart?: string;

  @IsOptional() @IsString()
  operatingHoursEnd?: string;

  @IsOptional() @IsString()
  timezone?: string;
}

export class AddMemberDto {
  @IsString()
  userId: string;

  @IsOptional() @IsString()
  role?: string; // MEMBER | LEAD
}
