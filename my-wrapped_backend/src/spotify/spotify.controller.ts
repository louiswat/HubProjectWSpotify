/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Headers,
  UnauthorizedException,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { SpotifyService } from './spotify.service';

@Controller('spotify')
export class SpotifyController {
  constructor(
    private readonly http: HttpService,
    private readonly spotifyService: SpotifyService,
  ) {}

  private extractToken(authHeader: string): string {
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException(
        'Missing or invalid Authorization header',
      );
    }
    return authHeader.replace('Bearer ', '');
  }

  @Post('set-token')
  setToken(@Body() body: { userId: string; token: string }) {
    if (!body.userId || !body.token) {
      throw new UnauthorizedException('Missing userId or token');
    }

    this.spotifyService.setUserToken(body.userId, body.token);
    return { success: true };
  }

  @Get('top')
  async getTop(
    @Query('type') type: 'tracks' | 'artists',
    @Query('timeRange') timeRange: 'short_term' | 'medium_term' | 'long_term',
    @Headers('authorization') authHeader: string,
  ) {
    const token = this.extractToken(authHeader);
    return this.spotifyService.getTopTracksOrArtistsFromToken(
      token,
      type,
      timeRange,
    );
  }

  @Get('search')
  async search(
    @Query('query') query: string,
    @Query('type') type: 'track' | 'artist',
    @Headers('authorization') authHeader: string,
  ) {
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid token');
    }

    const token = authHeader.split(' ')[1];
    return this.spotifyService.searchWithToken(token, query, type);
  }

  @Post('profile')
  async getProfileFromToken(@Body() body: { token: string }) {
    if (!body.token) {
      throw new UnauthorizedException('Missing token');
    }

    return this.spotifyService.getProfileFromToken(body.token);
  }
}
