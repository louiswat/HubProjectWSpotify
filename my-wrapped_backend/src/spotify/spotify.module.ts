import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { SpotifyService } from './spotify.service';
import { SpotifyController } from './spotify.controller';

@Module({
  imports: [HttpModule],
  controllers: [SpotifyController],
  providers: [SpotifyService],
  exports: [SpotifyService],
})
export class SpotifyModule {}
