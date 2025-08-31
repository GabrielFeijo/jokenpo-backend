import {
	Injectable,
	NotFoundException,
	BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMatchDto } from './dto/create-match.dto';
import { Match, Play, Choice, MatchStatus, RoomStatus } from '@prisma/client';
import { GAME_RULES } from '../common/types/game.types';

@Injectable()
export class MatchesService {
	constructor(private prisma: PrismaService) {}

	async createMatch(createMatchDto: CreateMatchDto): Promise<Match> {
		const { roomId, gameMode } = createMatchDto;

		const room = await this.prisma.room.findUnique({
			where: { id: roomId },
			include: { players: true },
		});

		if (!room) {
			throw new NotFoundException('Room not found');
		}

		if (room.players.length !== 2) {
			throw new BadRequestException(
				'Room must have exactly 2 players to start a match'
			);
		}

		const match = await this.prisma.match.create({
			data: {
				roomId,
				gameMode,
				status: MatchStatus.PLAYING,
			},
			include: {
				room: true,
				plays: true,
				results: true,
			},
		});

		return match;
	}

	async makePlay(
		matchId: string,
		playerId: string,
		choice: Choice
	): Promise<Play> {
		const match = await this.prisma.match.findUnique({
			where: { id: matchId },
			include: {
				room: true,
				plays: true,
			},
		});

		if (!match) {
			throw new NotFoundException('Match not found');
		}

		if (match.status !== MatchStatus.PLAYING) {
			throw new BadRequestException('Match is not active');
		}

		const currentRound = Math.floor(match.plays.length / 2) + 1;
		const existingPlay = match.plays.find(
			(play) => play.playerId === playerId && play.roundNumber === currentRound
		);

		if (existingPlay) {
			throw new BadRequestException(
				'Player already made a play for this round'
			);
		}

		const validChoices =
			match.gameMode === 'CLASSIC'
				? [Choice.ROCK, Choice.PAPER, Choice.SCISSORS]
				: [
						Choice.ROCK,
						Choice.PAPER,
						Choice.SCISSORS,
						Choice.LIZARD,
						Choice.SPOCK,
					];

		if (!validChoices.includes(choice)) {
			throw new BadRequestException(
				`Invalid choice for ${match.gameMode} mode`
			);
		}

		const play = await this.prisma.play.create({
			data: {
				matchId,
				playerId,
				choice,
				roundNumber: currentRound,
			},
		});

		return play;
	}

	async checkRoundComplete(matchId: string): Promise<{
		isComplete: boolean;
		match?: Match;
		result?: any;
		plays?: Play[];
	}> {
		const match = await this.prisma.match.findUnique({
			where: { id: matchId },
			include: {
				room: true,
				plays: {
					orderBy: {
						timestamp: 'desc',
					},
				},
			},
		});

		if (!match) {
			throw new NotFoundException('Match not found');
		}

		const currentRound = Math.floor(match.plays.length / 2);
		const roundPlays = match.plays.filter(
			(play) => play.roundNumber === currentRound
		);

		if (roundPlays.length === 2) {
			const [play1, play2] = roundPlays;
			const result = this.determineWinner(
				play1.choice,
				play2.choice,
				play1.playerId,
				play2.playerId
			);

			const savedResult = await this.prisma.result.create({
				data: {
					matchId,
					winnerId: result.winnerId,
					loserId: result.loserId,
					isDraw: result.isDraw,
					player1Choice: play1.choice,
					player2Choice: play2.choice,
					player1Score: result.winnerId === play1.playerId ? 1 : 0,
					player2Score: result.winnerId === play2.playerId ? 1 : 0,
					roundNumber: currentRound,
				},
			});

			const match = await this.prisma.match.update({
				where: { id: matchId },
				data: {
					status: MatchStatus.FINISHED,
					winnerId: result.winnerId,
					loserId: result.loserId,
					isDraw: result.isDraw,
					player1Score: result.winnerId === play1.playerId ? 1 : 0,
					player2Score: result.winnerId === play2.playerId ? 1 : 0,
					finishedAt: new Date(),
				},
			});

			return {
				isComplete: true,
				match,
				result: savedResult,
				plays: roundPlays,
			};
		}

		return { isComplete: false };
	}

	private determineWinner(
		choice1: Choice,
		choice2: Choice,
		player1Id: string,
		player2Id: string
	) {
		if (choice1 === choice2) {
			return {
				isDraw: true,
				winnerId: null,
				loserId: null,
			};
		}

		const choice1Wins = GAME_RULES[choice1].includes(choice2 as any);

		return {
			isDraw: false,
			winnerId: choice1Wins ? player1Id : player2Id,
			loserId: choice1Wins ? player2Id : player1Id,
		};
	}

	async getMatchHistory(userId: string, page = 1, limit = 10) {
		const skip = (page - 1) * limit;

		const [matches, total] = await Promise.all([
			this.prisma.match.findMany({
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
					winner: true,
					loser: true,
				},
				orderBy: {
					createdAt: 'desc',
				},
				skip,
				take: limit,
			}),
			this.prisma.match.count({
				where: {
					OR: [
						{ winnerId: userId },
						{ loserId: userId },
						{ isDraw: true, plays: { some: { playerId: userId } } },
					],
				},
			}),
		]);

		return {
			matches,
			total,
			hasMore: skip + matches.length < total,
			page,
			limit,
		};
	}

	async findById(id: string): Promise<Match> {
		const match = await this.prisma.match.findUnique({
			where: { id },
			include: {
				room: true,
				plays: {
					include: {
						player: true,
					},
					orderBy: {
						timestamp: 'asc',
					},
				},
				results: true,
				winner: true,
				loser: true,
			},
		});

		if (!match) {
			throw new NotFoundException(`Match with ID ${id} not found`);
		}

		return match;
	}
}
