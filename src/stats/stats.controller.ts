import { Controller, Get, Param, Query } from '@nestjs/common';
import { StatsService } from './stats.service';
import { StatsQueryDto } from './dto/stats-query.dto';

@Controller('stats')
export class StatsController {
	constructor(private readonly statsService: StatsService) {}

	@Get('dashboard')
	async getDashboardData(@Query() filters: StatsQueryDto) {
		return this.statsService.getDashboardData(filters);
	}

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
