import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StatsQueryDto } from './dto/stats-query.dto';
import { Choice } from '@prisma/client';

@Injectable()
export class StatsService {
	constructor(private prisma: PrismaService) {}

	async getUserStats(userId: string) {
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

		const draws = await this.prisma.match.count({
			where: {
				isDraw: true,
				plays: { some: { playerId: userId } },
			},
		});

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

		const favoriteChoice = choiceStats[0]?.choice || Choice.ROCK;

		const matchHistory = await this.prisma.match.findMany({
			where: {
				OR: [
					{ winnerId: userId },
					{ loserId: userId },
					{ isDraw: true, plays: { some: { playerId: userId } } },
				],
			},
			include: {
				plays: {
					include: {
						player: true,
					},
				},
				results: true,
				room: true,
				winner: true,
				loser: true,
			},
			orderBy: {
				createdAt: 'desc',
			},
			take: 10,
		});

		return {
			userStats: {
				totalMatches,
				wins,
				losses,
				draws,
				winRate,
				favoriteChoice,
				matchHistory,
			},
		};
	}

	async getGlobalStats() {
		const totalMatches = await this.prisma.match.count();

		const totalPlayers = await this.prisma.user.count({
			where: {
				plays: {
					some: {},
				},
			},
		});

		const globalChoiceStats = await this.prisma.play.groupBy({
			by: ['choice'],
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

		const mostPopularChoice = globalChoiceStats[0]?.choice || Choice.ROCK;

		const recentMatches = await this.prisma.match.findMany({
			include: {
				plays: {
					include: {
						player: true,
					},
				},
				results: true,
				room: true,
				winner: true,
				loser: true,
			},
			orderBy: {
				createdAt: 'desc',
			},
			take: 10,
		});

		const choiceDistribution = await this.prisma.play.groupBy({
			by: ['choice'],
			_count: {
				choice: true,
			},
			orderBy: {
				_count: {
					choice: 'desc',
				},
			},
		});

		const gameModeStats = await this.prisma.match.groupBy({
			by: ['gameMode'],
			_count: {
				gameMode: true,
			},
		});

		return {
			totalMatches,
			totalPlayers,
			mostPopularChoice,
			recentMatches,
			choiceDistribution,
			gameModeStats,
		};
	}

	async getDashboardData(filters: StatsQueryDto) {
		const {
			userId,
			gameMode,
			startDate,
			endDate,
			page = 1,
			limit = 10,
		} = filters;

		const skip = (page - 1) * limit;

		const where: any = {};

		if (userId) {
			where.OR = [
				{ winnerId: userId },
				{ loserId: userId },
				{ isDraw: true, plays: { some: { playerId: userId } } },
			];
		}

		if (gameMode) {
			where.gameMode = gameMode;
		}

		if (startDate || endDate) {
			where.createdAt = {};
			if (startDate) where.createdAt.gte = new Date(startDate);
			if (endDate) where.createdAt.lte = new Date(endDate);
		}

		const [matches, total] = await Promise.all([
			this.prisma.match.findMany({
				where,
				include: {
					plays: {
						include: {
							player: true,
						},
					},
					results: true,
					winner: true,
					loser: true,
				},
				orderBy: {
					createdAt: 'desc',
				},
				skip,
				take: limit,
			}),
			this.prisma.match.count({ where }),
		]);

		return {
			matches,
			total,
			hasMore: skip + matches.length < total,
			page,
			limit,
		};
	}

	async getChoiceAnalytics(userId?: string) {
		const where = userId ? { playerId: userId } : {};

		const choiceStats = await this.prisma.play.groupBy({
			by: ['choice'],
			where,
			_count: {
				choice: true,
			},
			orderBy: {
				_count: {
					choice: 'desc',
				},
			},
		});

		const totalPlays = choiceStats.reduce(
			(sum, stat) => sum + stat._count.choice,
			0
		);

		return choiceStats.map((stat) => ({
			choice: stat.choice,
			count: stat._count.choice,
			percentage: totalPlays > 0 ? (stat._count.choice / totalPlays) * 100 : 0,
		}));
	}

	async getWinRateByChoice(userId: string) {
		const choices = [
			Choice.ROCK,
			Choice.PAPER,
			Choice.SCISSORS,
			Choice.LIZARD,
			Choice.SPOCK,
		];

		const stats = await Promise.all(
			choices.map(async (choice) => {
				const totalGames = await this.prisma.play.count({
					where: {
						playerId: userId,
						choice,
					},
				});

				const wins = await this.prisma.match.count({
					where: {
						winnerId: userId,
						plays: {
							some: {
								playerId: userId,
								choice,
							},
						},
					},
				});

				const winRate = totalGames > 0 ? wins / totalGames : 0;

				return {
					choice,
					totalGames,
					wins,
					winRate,
				};
			})
		);

		return stats.filter((stat) => stat.totalGames > 0);
	}
}
