import { GameMode } from '@prisma/client';
import { IsEnum, IsString } from 'class-validator';

export class CreateRoomDto {
	@IsEnum(GameMode)
	gameMode: GameMode;

	@IsString()
	userId: string;
}

export class JoinRoomDto {
	@IsString()
	roomId: string;

	@IsString()
	userId: string;
}
