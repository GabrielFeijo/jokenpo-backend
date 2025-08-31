import { Controller, Post, Get, Param, Body, Patch } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';

@Controller('users')
export class UsersController {
	constructor(private readonly usersService: UsersService) {}

	@Post('guest')
	async createGuestUser(@Body() createUserDto?: CreateUserDto) {
		return this.usersService.createGuestUser(createUserDto);
	}

	@Get(':id')
	async findById(@Param('id') id: string) {
		return this.usersService.findById(id);
	}

	@Get(':id/stats')
	async getUserStats(@Param('id') id: string) {
		return this.usersService.getUserStats(id);
	}

	@Patch(':id')
	async updateUser(
		@Param('id') id: string,
		@Body() updateUserDto: CreateUserDto
	) {
		return this.usersService.updateUser(id, updateUserDto);
	}
}
