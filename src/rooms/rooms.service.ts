import {
	Injectable,
	NotFoundException,
	BadRequestException,
	ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoomDto, JoinRoomDto } from './dto/create-room.dto';
import { Room, RoomStatus, GameMode, MatchStatus } from '@prisma/client';
import { nanoid } from 'nanoid';

@Injectable()
export class RoomsService {
	constructor(private prisma: PrismaService) {}

	async createRoom(createRoomDto: CreateRoomDto): Promise<Room> {
		const { gameMode, userId } = createRoomDto;

		const user = await this.prisma.user.findUnique({
			where: { id: userId },
		});

		if (!user) {
			throw new NotFoundException('User not found');
		}

		let inviteCode: string;
		let isUnique = false;

		do {
			inviteCode = nanoid(6).toUpperCase();
			const existing = await this.prisma.room.findUnique({
				where: { inviteCode },
			});
			isUnique = !existing;
		} while (!isUnique);

		const room = await this.prisma.room.create({
			data: {
				inviteCode,
				createdBy: userId,
				gameMode: gameMode as GameMode,
				status: RoomStatus.WAITING,
				playerIds: [userId],
			},
			include: {
				creator: true,
				players: true,
				matches: {
					include: {
						plays: true,
						results: true,
					},
					orderBy: {
						createdAt: 'desc',
					},
				},
			},
		});

		return room;
	}

	async joinRoom(joinRoomDto: JoinRoomDto): Promise<Room> {
		const { roomId, userId } = joinRoomDto;

		const room = await this.prisma.room.findFirst({
			where: {
				inviteCode: roomId.toUpperCase(),
			},
			include: {
				creator: true,
				players: true,
				matches: {
					include: {
						plays: true,
						results: true,
					},
					orderBy: {
						createdAt: 'desc',
					},
				},
			},
		});

		if (!room) {
			throw new NotFoundException('Room not found');
		}

		if (
			room.players.length >= 2 &&
			!room.players.find((p) => p.id === userId)
		) {
			throw new ConflictException('Room is full. Maximum 2 players allowed.');
		}

		if (room.playerIds.includes(userId)) {
			return room;
		}

		if (room.status === RoomStatus.PLAYING) {
			throw new ConflictException('Game already in progress');
		}

		const updatedRoom = await this.prisma.room.update({
			where: { id: room.id },
			data: {
				playerIds: {
					push: userId,
				},
				status:
					room.players.length === 1 ? RoomStatus.READY : RoomStatus.WAITING,
			},
			include: {
				creator: true,
				players: true,
				matches: {
					include: {
						plays: true,
						results: true,
					},
					orderBy: {
						createdAt: 'desc',
					},
				},
			},
		});

		return updatedRoom;
	}

	async findById(id: string): Promise<Room> {
		const room = await this.prisma.room.findUnique({
			where: { id },
			include: {
				creator: true,
				players: true,
				matches: {
					include: {
						plays: true,
						results: true,
					},
					orderBy: {
						createdAt: 'desc',
					},
				},
			},
		});

		if (!room) {
			throw new NotFoundException(`Room with ID ${id} not found`);
		}

		return room;
	}

	async findByInviteCode(inviteCode: string) {
		const room = await this.prisma.room.findUnique({
			where: { inviteCode: inviteCode.toUpperCase() },
			include: {
				creator: true,
				players: true,
				matches: {
					where: {
						status: {
							not: MatchStatus.FINISHED,
						},
					},
					include: {
						plays: true,
						results: true,
					},
					orderBy: {
						createdAt: 'desc',
					},
				},
			},
		});

		if (!room) {
			throw new NotFoundException(
				`Room with invite code ${inviteCode} not found`
			);
		}

		return { ...room, cuurentMatch: room.matches[room.matches.length - 1] };
	}

	async updateRoomStatus(roomId: string, status: RoomStatus): Promise<Room> {
		return this.prisma.room.update({
			where: { id: roomId },
			data: { status },
			include: {
				creator: true,
				players: true,
				matches: true,
			},
		});
	}

	async removePlayerFromRoom(roomId: string, userId: string): Promise<Room> {
		const room = await this.findById(roomId);

		const updatedPlayerIds = room.playerIds.filter((id) => id !== userId);

		const newStatus =
			updatedPlayerIds.length === 0 ? RoomStatus.FINISHED : RoomStatus.WAITING;

		return this.prisma.room.update({
			where: { id: roomId },
			data: {
				playerIds: updatedPlayerIds,
				status: newStatus,
			},
			include: {
				creator: true,
				players: true,
				matches: true,
			},
		});
	}

	async getRoomStats(roomId: string) {
		const room = await this.findById(roomId);

		const totalMatches = await this.prisma.match.count({
			where: { roomId },
		});

		const matches = await this.prisma.match.findMany({
			where: { roomId },
			include: {
				plays: true,
				results: true,
				winner: true,
				loser: true,
			},
			orderBy: {
				createdAt: 'desc',
			},
		});

		return {
			room,
			totalMatches,
			matches,
		};
	}
}
