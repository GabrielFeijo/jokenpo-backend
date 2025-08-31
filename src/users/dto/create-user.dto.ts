import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateUserDto {
	@IsString()
	@IsOptional()
	name?: string;

	@IsBoolean()
	@IsOptional()
	isGuest?: boolean = true;
}
