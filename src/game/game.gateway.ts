import {
	WebSocketGateway,
	WebSocketServer,
	SubscribeMessage,
	ConnectedSocket,
	MessageBody,
	OnGatewayInit,
	OnGatewayConnection,
	OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UsePipes, ValidationPipe } from '@nestjs/common';
import { RoomsService } from '../rooms/rooms.service';
import { MatchesService } from '../matches/matches.service';
import { UsersService } from '../users/users.service';
import {
	JoinRoomEventDto,
	PlayerReadyEventDto,
	MakePlayEventDto,
	RematchEventDto,
} from './dto/game-events.dto';
import {
	GameState,
	SocketUser,
	SocketRoom,
} from '../common/interfaces/socket.interfaces';
import { RoomStatus } from '@prisma/client';

@WebSocketGateway({
	cors: {
		credentials: true,
	},
})
@UsePipes(new ValidationPipe({ transform: true }))
export class GameGateway
	implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
	@WebSocketServer()
	server: Server;

	private logger: Logger = new Logger('GameGateway');
	private gameState: GameState = {
		rooms: new Map(),
		users: new Map(),
		matches: new Map(),
	};

	constructor(
		private roomsService: RoomsService,
		private matchesService: MatchesService,
		private usersService: UsersService
	) {}

	afterInit(server: Server) {
		this.logger.log('🎮 Game WebSocket Gateway initialized');
	}

	async handleConnection(client: Socket) {
		this.logger.log(`🔌 Client connected: ${client.id}`);

		client.emit('connected', { socketId: client.id });
	}

	async handleDisconnect(client: Socket) {
		this.logger.log(`🔌 Client disconnected: ${client.id}`);

		const user = Array.from(this.gameState.users.values()).find(
			(u) => u.socketId === client.id
		);
		if (user?.roomId) {
			await this.handleLeaveRoom(client, {
				roomId: user.roomId,
				userId: user.id,
			});
		}

		this.gameState.users.delete(client.id);
	}

	@SubscribeMessage('join-room')
	async handleJoinRoom(
		@ConnectedSocket() client: Socket,
		@MessageBody() data: JoinRoomEventDto
	) {
		try {
			const { roomId, userId } = data;

			const room = await this.roomsService.findById(roomId);
			const user = await this.usersService.findById(userId);

			if (room.playerIds.length > 2) {
				client.emit('game-error', {
					message: 'Esta sala já está cheia! Máximo 2 jogadores.',
					code: 'ROOM_FULL',
				});
				return;
			}

			await this.usersService.updateSocketId(userId, client.id);

			const socketUser: SocketUser = {
				id: userId,
				name: user.name || undefined,
				socketId: client.id,
				roomId,
				isReady: false,
			};

			this.gameState.users.set(client.id, socketUser);

			client.join(roomId);

			let socketRoom = this.gameState.rooms.get(roomId);
			if (!socketRoom) {
				socketRoom = {
					id: roomId,
					inviteCode: room.inviteCode,
					createdBy: room.createdBy,
					gameMode: room.gameMode,
					players: [],
					status: room.status,
				};
				this.gameState.rooms.set(roomId, socketRoom!);
			}

			if (!socketRoom?.players.find((p) => p.id === userId)) {
				socketRoom?.players.push(socketUser);
			}

			client.emit('room-joined', { room: socketRoom });
			client.to(roomId).emit('player-joined', { user: socketUser });
			this.server.to(roomId).emit('room-updated', { room: socketRoom });

			this.logger.log(`👤 User ${userId} joined room ${roomId}`);
		} catch (error) {
			this.logger.error(`❌ Error joining room: ${error.message}`);
			client.emit('game-error', {
				message: error.message,
				code: 'JOIN_ROOM_ERROR',
			});
		}
	}

	@SubscribeMessage('leave-room')
	async handleLeaveRoom(
		@ConnectedSocket() client: Socket,
		@MessageBody() data: JoinRoomEventDto
	) {
		try {
			const { roomId, userId } = data;

			client.leave(roomId);

			const socketRoom = this.gameState.rooms.get(roomId);
			if (socketRoom) {
				socketRoom.players = socketRoom.players.filter((p) => p.id !== userId);

				if (socketRoom.players.length === 0) {
					this.gameState.rooms.delete(roomId);
				} else {
					socketRoom.players.forEach((p) => (p.isReady = false));
					socketRoom.status = RoomStatus.WAITING;
				}
			}

			await this.roomsService.removePlayerFromRoom(roomId, userId);

			client.to(roomId).emit('player-left', { userId });
			this.server.to(roomId).emit('room-updated', { room: socketRoom });

			this.logger.log(`👋 User ${userId} left room ${roomId}`);
		} catch (error) {
			this.logger.error(`❌ Error leaving room: ${error.message}`);
		}
	}

	@SubscribeMessage('player-ready')
	async handlePlayerReady(
		@ConnectedSocket() client: Socket,
		@MessageBody() data: PlayerReadyEventDto
	) {
		try {
			const { roomId, userId } = data;

			const user = this.gameState.users.get(client.id);
			if (user) {
				user.isReady = true;
			}

			const socketRoom = this.gameState.rooms.get(roomId);
			if (socketRoom) {
				const player = socketRoom.players.find((p) => p.id === userId);
				if (player) {
					player.isReady = true;
				}

				const readyPlayers = socketRoom.players.filter((p) => p.isReady);
				if (readyPlayers.length === 2 && socketRoom.players.length === 2) {
					await this.startGame(roomId, socketRoom);
				}
			}

			this.server.to(roomId).emit('room-updated', { room: socketRoom });

			this.logger.log(`✅ User ${userId} is ready in room ${roomId}`);
		} catch (error) {
			this.logger.error(`❌ Error setting player ready: ${error.message}`);
			client.emit('game-error', {
				message: error.message,
				code: 'PLAYER_READY_ERROR',
			});
		}
	}

	@SubscribeMessage('make-play')
	async handleMakePlay(
		@ConnectedSocket() client: Socket,
		@MessageBody() data: MakePlayEventDto
	) {
		try {
			const { roomId, userId, choice } = data;

			const socketRoom = this.gameState.rooms.get(roomId);
			if (!socketRoom?.currentMatchId) {
				client.emit('game-error', {
					message: 'No active match in this room',
					code: 'NO_ACTIVE_MATCH',
				});
				return;
			}

			const play = await this.matchesService.makePlay(
				socketRoom.currentMatchId,
				userId,
				choice
			);

			this.server.to(roomId).emit('play-made', { play });

			const roundCheck = await this.matchesService.checkRoundComplete(
				socketRoom.currentMatchId
			);

			if (roundCheck.isComplete) {
				this.server.to(roomId).emit('match-finished', {
					match: roundCheck.match,
					result: roundCheck.result,
					plays: roundCheck.plays,
				});

				const matchState = this.gameState.matches.get(
					socketRoom.currentMatchId
				);
				if (matchState) {
					matchState.plays.clear();
				}
			}

			this.logger.log(`🎯 User ${userId} played ${choice} in room ${roomId}`);
		} catch (error) {
			this.logger.error(`❌ Error making play: ${error.message}`);
			client.emit('game-error', {
				message: error.message,
				code: 'MAKE_PLAY_ERROR',
			});
		}
	}

	@SubscribeMessage('rematch')
	async handleRematch(
		@ConnectedSocket() client: Socket,
		@MessageBody() data: RematchEventDto
	) {
		try {
			const { roomId, userId } = data;

			const socketRoom = this.gameState.rooms.get(roomId);
			if (!socketRoom) {
				client.emit('game-error', {
					message: 'Room not found',
					code: 'ROOM_NOT_FOUND',
				});
				return;
			}

			await this.startGame(roomId, socketRoom);

			this.server.to(roomId).emit('rematch-started', {
				roomId,
			});

			this.logger.log(`🔄 Rematch started in room ${roomId} by user ${userId}`);
		} catch (error) {
			this.logger.error(`❌ Error starting rematch: ${error.message}`);
			client.emit('game-error', {
				message: error.message,
				code: 'REMATCH_ERROR',
			});
		}
	}

	private async startGame(roomId: string, socketRoom: SocketRoom) {
		try {
			const match = await this.matchesService.createMatch({
				roomId,
				gameMode: socketRoom.gameMode,
			});

			await this.roomsService.updateRoomStatus(roomId, RoomStatus.PLAYING);
			socketRoom.status = RoomStatus.PLAYING;
			socketRoom.currentMatchId = match.id;

			this.gameState.matches.set(match.id, {
				id: match.id,
				roomId,
				players: socketRoom.players.map((p) => p.id),
				plays: new Map(),
				isComplete: false,
			});

			socketRoom.players.forEach((p) => (p.isReady = false));

			this.server.to(roomId).emit('game-started', { match });
			this.server.to(roomId).emit('room-updated', { room: socketRoom });

			this.logger.log(`🎮 Game started in room ${roomId}, match ${match.id}`);
		} catch (error) {
			this.logger.error(`❌ Error starting game: ${error.message}`);
			this.server.to(roomId).emit('error', {
				message: 'Erro ao iniciar o jogo',
				code: 'START_GAME_ERROR',
			});
		}
	}
}
