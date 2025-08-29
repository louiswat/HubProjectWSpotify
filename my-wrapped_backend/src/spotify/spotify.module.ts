import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { SpotifyService } from './spotify.service';
import { SpotifyController } from './spotify.controller';

import { PlayerController } from '../player/player.controller';
import { PlayerService } from '../player/player.service';

@Module({
  imports: [HttpModule],
  controllers: [SpotifyController, PlayerController],
  providers: [SpotifyService, PlayerService],
  exports: [SpotifyService, PlayerService],
})
export class SpotifyModule {}