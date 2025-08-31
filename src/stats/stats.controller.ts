import { Controller, Get, Param, Query } from '@nestjs/common';
import { StatsService } from './stats.service';

@Controller('stats')
export class StatsController {
	constructor(private readonly statsService: StatsService) {}

	@Get('user/:userId')
	async getUserStats(@Param('userId') userId: string) {
		return this.statsService.getUserStats(userId);
	}

	@Get('global')
	async getGlobalStats() {
		return this.statsService.getGlobalStats();
	}

	@Get('choices/:userId')
	async getChoiceAnalytics(@Param('userId') userId: string) {
		return this.statsService.getChoiceAnalytics(userId);
	}

	@Get('winrate/:userId')
	async getWinRateByChoice(@Param('userId') userId: string) {
		return this.statsService.getWinRateByChoice(userId);
	}
}
