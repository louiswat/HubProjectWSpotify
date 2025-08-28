/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Headers,
  UnauthorizedException,
  Param,
  Put,
  Delete
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { SpotifyService } from './spotify.service';

@Controller('spotify')
export class SpotifyController {
  constructor(
    private readonly http: HttpService,
    private readonly spotifyService: SpotifyService,
  ) { }

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

  // --- NEW: playlists list (GET /spotify/playlists) ---
  @Get('playlists')
  async getPlaylists(
    @Headers('authorization') authHeader: string,
    @Query('limit') limit = '50',
    @Query('offset') offset = '0',
  ) {
    const token = this.extractToken(authHeader);
    return this.spotifyService.getUserPlaylistsFromToken(
      token,
      Number(limit),
      Number(offset),
    );
  }

  // --- NEW: playlist header + tracks (GET /spotify/playlists/:id) ---
  @Get('playlists/:id')
  async getPlaylist(
    @Headers('authorization') authHeader: string,
    @Param('id') id: string,
    @Query('limit') limit = '100',
    @Query('offset') offset = '0',
  ) {
    const token = this.extractToken(authHeader);
    return this.spotifyService.getPlaylistWithTracksFromToken(
      token,
      id,
      Number(limit),
      Number(offset),
    );
  }


  @Put('playlists/:id/details')
  async updatePlaylistDetails(
    @Headers('authorization') authHeader: string,
    @Param('id') id: string,
    @Body() body: { name?: string; description?: string; isPublic?: boolean },
  ) {
    const token = this.extractToken(authHeader);
    return this.spotifyService.updatePlaylistDetailsFromToken(
      token,
      id,
      body?.name,
      body?.description,
      body?.isPublic,
    );
  }

  // replace entire ordering with provided URIs (simple & robust)
  @Put('playlists/:id/replace')
  async replacePlaylistTracks(
    @Headers('authorization') authHeader: string,
    @Param('id') id: string,
    @Body() body: { uris: string[] },
  ) {
    const token = this.extractToken(authHeader);
    return this.spotifyService.replacePlaylistTracksFromToken(
      token,
      id,
      Array.isArray(body?.uris) ? body.uris : [],
    );
  }

  // remove tracks (one or many) by URI
  @Delete('playlists/:id/tracks')
  async removeTracks(
    @Headers('authorization') authHeader: string,
    @Param('id') id: string,
    @Body() body: { uris: string[]; snapshot_id?: string },
  ) {
    const token = this.extractToken(authHeader);
    return this.spotifyService.removeTracksFromPlaylistFromToken(
      token,
      id,
      Array.isArray(body?.uris) ? body.uris : [],
      body?.snapshot_id,
    );
  }


  @Get('following/contains')
  async followingContains(
    @Query('ids') idsCsv: string,
    @Query('type') type: 'artist' | 'user' = 'artist',
    @Headers('authorization') authHeader: string,
  ) {
    if (type !== 'artist') {
      // keep it strict for now; broaden later if you need users
      throw new UnauthorizedException('Only artist following is supported');
    }
    const token = this.extractToken(authHeader);
    const ids = (idsCsv || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    return this.spotifyService.checkFollowingArtists(token, ids);
  }

  @Put('following')
  async follow(
    @Query('ids') idsCsv: string,
    @Query('type') type: 'artist' | 'user' = 'artist',
    @Headers('authorization') authHeader: string,
  ) {
    if (type !== 'artist') {
      throw new UnauthorizedException('Only artist following is supported');
    }
    const token = this.extractToken(authHeader);
    const ids = (idsCsv || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    await this.spotifyService.followArtists(token, ids);
    return { success: true };
  }

  @Delete('following')
  async unfollow(
    @Query('ids') idsCsv: string,
    @Query('type') type: 'artist' | 'user' = 'artist',
    @Headers('authorization') authHeader: string,
  ) {
    if (type !== 'artist') {
      throw new UnauthorizedException('Only artist following is supported');
    }
    const token = this.extractToken(authHeader);
    const ids = (idsCsv || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    await this.spotifyService.unfollowArtists(token, ids);
    return { success: true };
  }

  @Get('artists/:id/top-tracks')
  async getArtistTop(
    @Param('id') id: string,
    @Query('market') market: string,
    @Headers('authorization') authHeader: string,
  ) {
    const token = this.extractToken(authHeader);
    return this.spotifyService.getArtistTopTracks(token, id, market || 'US');
  }
}
