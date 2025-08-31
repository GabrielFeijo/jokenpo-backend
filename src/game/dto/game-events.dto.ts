import { Choice } from '@prisma/client';
import { IsString, IsEnum } from 'class-validator';

export class JoinRoomEventDto {
	@IsString()
	roomId: string;

	@IsString()
	userId: string;
}

export class PlayerReadyEventDto {
	@IsString()
	roomId: string;

	@IsString()
	userId: string;
}

export class MakePlayEventDto {
	@IsString()
	roomId: string;

	@IsString()
	userId: string;

	@IsEnum(Choice)
	choice: Choice;
}

export class RematchEventDto {
	@IsString()
	roomId: string;

	@IsString()
	userId: string;
}
