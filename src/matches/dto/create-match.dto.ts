import { GameMode } from '@prisma/client';
import { IsString, IsEnum } from 'class-validator';

export class CreateMatchDto {
	@IsString()
	roomId: string;

	@IsEnum(GameMode)
	gameMode: GameMode;
}
