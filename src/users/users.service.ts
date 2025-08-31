import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from '@prisma/client';
import { nanoid } from 'nanoid';

@Injectable()
export class UsersService {
	constructor(private prisma: PrismaService) {}

	async createGuestUser(createUserDto?: CreateUserDto): Promise<User> {
		const guestName = createUserDto?.name || `Guest_${nanoid(6)}`;

		return this.prisma.user.create({
			data: {
				name: guestName,
				isGuest: true,
			},
		});
	}

	async findById(id: string): Promise<User> {
		const user = await this.prisma.user.findUnique({
			where: { id },
			include: {
				plays: {
					include: {
						match: true,
					},
					orderBy: {
						timestamp: 'desc',
					},
					take: 10,
				},
				wonMatches: {
					include: {
						plays: true,
					},
					orderBy: {
						createdAt: 'desc',
					},
				},
			},
		});

		if (!user) {
			throw new NotFoundException(`User with ID ${id} not found`);
		}

		return user;
	}

	async updateUser(
		id: string,
		updateData: Partial<CreateUserDto>
	): Promise<User> {
		return this.prisma.user.update({
			where: { id },
			data: updateData,
		});
	}

	async updateSocketId(userId: string, socketId: string): Promise<User> {
		return this.prisma.user.update({
			where: { id: userId },
			data: { socketId },
		});
	}

	async getUserStats(userId: string) {
		const user = await this.findById(userId);

		const totalMatches = await this.prisma.match.count({
			where: {
				OR: [
					{ winnerId: userId },
					{ loserId: userId },
					{ isDraw: true, plays: { some: { playerId: userId } } },
				],
			},
		});

		const wins = await this.prisma.match.count({
			where: { winnerId: userId },
		});

		const losses = await this.prisma.match.count({
			where: { loserId: userId },
		});

		const draws = totalMatches - wins - losses;
		const winRate = totalMatches > 0 ? wins / totalMatches : 0;

		const choiceStats = await this.prisma.play.groupBy({
			by: ['choice'],
			where: { playerId: userId },
			_count: {
				choice: true,
			},
			orderBy: {
				_count: {
					choice: 'desc',
				},
			},
			take: 1,
		});

		const favoriteChoice = choiceStats[0]?.choice || 'ROCK';

		const recentMatches = await this.prisma.match.findMany({
			where: {
				OR: [
					{ winnerId: userId },
					{ loserId: userId },
					{ isDraw: true, plays: { some: { playerId: userId } } },
				],
			},
			include: {
				plays: true,
				results: true,
				room: true,
			},
			orderBy: {
				createdAt: 'desc',
			},
			take: 10,
		});

		return {
			user,
			stats: {
				totalMatches,
				wins,
				losses,
				draws,
				winRate,
				favoriteChoice,
				recentMatches,
			},
		};
	}
}
