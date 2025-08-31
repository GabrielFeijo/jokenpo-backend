import { Controller, Get, Query } from '@nestjs/common';
import { StatsService } from '../stats/stats.service';
import { StatsQueryDto } from '../stats/dto/stats-query.dto';

@Controller('dashboard')
export class DashboardController {
	constructor(private readonly statsService: StatsService) {}

	@Get()
	async getDashboardData(@Query() filters: StatsQueryDto) {
		return this.statsService.getDashboardData(filters);
	}
}
