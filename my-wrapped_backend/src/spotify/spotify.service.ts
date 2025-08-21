import { Injectable, UnauthorizedException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';

const userTokens = new Map<string, string>();

@Injectable()
export class SpotifyService {
  constructor(private readonly http: HttpService) {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  }

  setUserToken(userId: string, token: string) {
    userTokens.set(userId, token);
  }

  getUserToken(userId: string): string {
    const token = userTokens.get(userId);
    if (!token) {
      throw new UnauthorizedException('No token for user');
    }
    return token;
  }

  async getTopTracksOrArtistsFromToken(
    token: string,
    type: 'tracks' | 'artists',
    timeRange: 'short_term' | 'medium_term' | 'long_term',
  ) {
    const res = await firstValueFrom(
      this.http.get(`https://api.spotify.com/v1/me/top/${type}`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          time_range: timeRange,
          limit: 10,
        },
      }),
    );
    return res.data.items;
  }

  async searchWithToken(
    token: string,
    query: string,
    type: 'track' | 'artist',
  ) {
    const res = await firstValueFrom(
      this.http.get(`https://api.spotify.com/v1/search`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          q: query,
          type,
          limit: 10,
        },
      }),
    );
    return type === 'track' ? res.data.tracks.items : res.data.artists.items;
  }

  async getProfileFromToken(token: string) {
    try {
      const res = await firstValueFrom(
        this.http.get('https://api.spotify.com/v1/me', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      );

      const user = res.data;

      // store token with the user's id
      this.setUserToken(user.id, token);

      return user;
    } catch (error) {
      const err = error as AxiosError;
      console.error(
        'Spotify Profile Error:',
        err?.response?.data || err.message,
      );
      throw new UnauthorizedException('Failed to fetch user profile');
    }
  }
}
