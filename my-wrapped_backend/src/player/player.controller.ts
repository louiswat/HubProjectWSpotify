import {
  BadRequestException,
  Body,
  Controller,
  Headers,
  Post,
  Put,
} from '@nestjs/common';
import { PlayerService } from './player.service';

@Controller('spotify/player')
export class PlayerController {
  constructor(private readonly player: PlayerService) {}

  // POST /spotify/player/transfer
  @Post('transfer')
  async transfer(
    @Headers('authorization') auth: string,
    @Body() dto: { device_id: string; play?: boolean },
  ) {
    if (!dto?.device_id) {
      throw new BadRequestException('device_id required');
    }
    return this.player.transfer(auth, dto.device_id, dto.play);
  }


  @Put('play')
  async play(@Headers('authorization') auth: string, @Body() body: any) {
    return this.player.play(auth, body ?? {});
  }

  // PUT /spotify/player/pause
  @Put('pause')
  async pause(@Headers('authorization') auth: string) {
    return this.player.pause(auth);
  }

  // POST /spotify/player/next
  @Post('next')
  async next(@Headers('authorization') auth: string) {
    return this.player.next(auth);
  }

  // POST /spotify/player/previous
  @Post('previous')
  async previous(@Headers('authorization') auth: string) {
    return this.player.previous(auth);
  }

  // PUT /spotify/player/volume
  // Body: { volume_percent: number } (0..100)
  @Put('volume')
  async volume(
    @Headers('authorization') auth: string,
    @Body() dto: { volume_percent: number },
  ) {
    const percent = dto?.volume_percent;
    if (typeof percent !== 'number')
      throw new BadRequestException('volume_percent required');
    return this.player.volume(auth, percent);
  }
}
