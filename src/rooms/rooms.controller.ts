import { Controller, Post, Get, Param, Body } from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { CreateRoomDto, JoinRoomDto } from './dto/create-room.dto';

@Controller('rooms')
export class RoomsController {
	constructor(private readonly roomsService: RoomsService) {}

	@Post()
	async createRoom(@Body() createRoomDto: CreateRoomDto) {
		const room = await this.roomsService.createRoom(createRoomDto);

		return {
			room,
			socketUrl: `${process.env.BACKEND_URL || 'http://localhost:3333'}`,
		};
	}

	@Post('join')
	async joinRoom(@Body() joinRoomDto: JoinRoomDto) {
		const room = await this.roomsService.joinRoom(joinRoomDto);

		return {
			room,
			socketUrl: `${process.env.BACKEND_URL || 'http://localhost:3333'}`,
		};
	}

	@Get(':id')
	async findById(@Param('id') id: string) {
		return this.roomsService.findById(id);
	}

	@Get('invite/:code')
	async findByInviteCode(@Param('code') code: string) {
		return this.roomsService.findByInviteCode(code);
	}

	@Get(':id/stats')
	async getRoomStats(@Param('id') id: string) {
		return this.roomsService.getRoomStats(id);
	}
}
