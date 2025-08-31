import {
	IsOptional,
	IsString,
	IsEnum,
	IsDateString,
	IsInt,
	Min,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { GameMode } from '@prisma/client';

export class StatsQueryDto {
	@IsOptional()
	@IsString()
	userId?: string;

	@IsOptional()
	@IsEnum(GameMode)
	gameMode?: GameMode;

	@IsOptional()
	@IsDateString()
	startDate?: string;

	@IsOptional()
	@IsDateString()
	endDate?: string;

	@IsOptional()
	@Type(() => Number)
	@IsInt()
	@Min(1)
	page?: number = 1;

	@IsOptional()
	@Type(() => Number)
	@IsInt()
	@Min(1)
	limit?: number = 10;
}
