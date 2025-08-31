import { Choice } from '@prisma/client';

export const GAME_RULES: Record<Choice, Choice[]> = {
	[Choice.ROCK]: [Choice.SCISSORS, Choice.LIZARD],
	[Choice.PAPER]: [Choice.ROCK, Choice.SPOCK],
	[Choice.SCISSORS]: [Choice.PAPER, Choice.LIZARD],
	[Choice.LIZARD]: [Choice.SPOCK, Choice.PAPER],
	[Choice.SPOCK]: [Choice.SCISSORS, Choice.ROCK],
};
