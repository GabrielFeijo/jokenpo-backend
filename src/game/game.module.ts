import { Module } from '@nestjs/common';
import { GameGateway } from './game.gateway';
import { RoomsModule } from '../rooms/rooms.module';
import { MatchesModule } from '../matches/matches.module';
import { UsersModule } from '../users/users.module';

@Module({
	imports: [RoomsModule, MatchesModule, UsersModule],
	providers: [GameGateway],
	exports: [GameGateway],
})
export class GameModule {}
