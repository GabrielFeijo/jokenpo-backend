import { Controller, Post, Get, Param, Body, Query } from '@nestjs/common';
import { MatchesService } from './matches.service';
import { CreateMatchDto } from './dto/create-match.dto';

@Controller('matches')
export class MatchesController {
	constructor(private readonly matchesService: MatchesService) {}

	@Post()
	async createMatch(@Body() createMatchDto: CreateMatchDto) {
		return this.matchesService.createMatch(createMatchDto);
	}

	@Get(':id')
	async findById(@Param('id') id: string) {
		return this.matchesService.findById(id);
	}

	@Get('history/:userId')
	async getMatchHistory(
		@Param('userId') userId: string,
		@Query('page') page = 1,
		@Query('limit') limit = 10
	) {
		return this.matchesService.getMatchHistory(
			userId,
			Number(page),
			Number(limit)
		);
	}
}
