import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { PrismaModule } from './prisma/prisma.module';
import { StatsModule } from './stats/stats.module';
import { RoomsModule } from './rooms/rooms.module';
import { GameModule } from './game/game.module';
import { MatchesModule } from './matches/matches.module';

@Module({
	imports: [
		UsersModule,
		PrismaModule,
		StatsModule,
		RoomsModule,
		GameModule,
		MatchesModule,
		RoomsModule,
	],
})
export class AppModule {}
