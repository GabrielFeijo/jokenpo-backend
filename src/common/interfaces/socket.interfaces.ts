import { Choice, GameMode, RoomStatus } from '@prisma/client';

export interface SocketUser {
	id: string;
	name?: string;
	socketId: string;
	roomId?: string;
	isReady: boolean;
}

export interface SocketRoom {
	id: string;
	inviteCode: string;
	createdBy: string;
	gameMode: GameMode;
	players: SocketUser[];
	status: RoomStatus;
	currentMatchId?: string;
}

export interface GameState {
	rooms: Map<string, SocketRoom>;
	users: Map<string, SocketUser>;
	matches: Map<string, MatchGameState>;
}

export interface MatchGameState {
	id: string;
	roomId: string;
	players: string[];
	plays: Map<string, Choice>;
	isComplete: boolean;
	result?: {
		winnerId?: string;
		loserId?: string;
		isDraw: boolean;
	};
}
