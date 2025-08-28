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

  async getUserPlaylistsFromToken(token: string, limit = 50, offset = 0) {
    const res = await firstValueFrom(
      this.http.get('https://api.spotify.com/v1/me/playlists', {
        headers: { Authorization: `Bearer ${token}` },
        params: { limit, offset },
      }),
    );
    // return an array so the frontend can consume it directly
    return res.data?.items ?? [];
  }

  async getPlaylistWithTracksFromToken(
    token: string,
    id: string,
    limit = 100,
    offset = 0,
  ) {
    const [plRes, tracksRes] = await Promise.all([
      firstValueFrom(
        this.http.get(`https://api.spotify.com/v1/playlists/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ),
      firstValueFrom(
        this.http.get(`https://api.spotify.com/v1/playlists/${id}/tracks`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { limit, offset },
        }),
      ),
    ]);

    const header = plRes.data;
    const items = tracksRes.data?.items ?? [];

    // compact shape for the frontend detail page
    return {
      id: header.id,
      name: header.name,
      description: header.description,
      images: header.images ?? [],
      owner: { display_name: header.owner?.display_name ?? '' },
      tracksTotal: header.tracks?.total ?? 0,
      public: !!header.public,
      snapshotId: header.snapshot_id,
      tracks: items.map((it: any, idx: number) => ({
        position: offset + idx + 1,
        addedAt: it.added_at,
        id: it.track?.id,
        uri: it.track?.uri,
        name: it.track?.name,
        durationMs: it.track?.duration_ms,
        explicit: !!it.track?.explicit,
        album: { id: it.track?.album?.id, name: it.track?.album?.name },
        artists: (it.track?.artists || []).map((a: any) => ({ id: a.id, name: a.name })),
      })),
    };
  }

  async updatePlaylistDetailsFromToken(
  token: string,
  id: string,
  name?: string,
  description?: string,
  isPublic?: boolean,
) {
  const body: any = {};
  if (typeof name === 'string') body.name = name;
  if (typeof description === 'string') body.description = description;
  if (typeof isPublic === 'boolean') body.public = isPublic;

  const res = await firstValueFrom(
    this.http.put(`https://api.spotify.com/v1/playlists/${id}`, body, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    }),
  );
  return { ok: true, snapshot_id: res.data?.snapshot_id };
}

// Replace the entire playlist items with the given URIs (supports up to 100 URIs per request)
async replacePlaylistTracksFromToken(token: string, id: string, uris: string[]) {
  if (!Array.isArray(uris) || uris.length === 0) {
    return { ok: true };
  }
  const res = await firstValueFrom(
    this.http.put(`https://api.spotify.com/v1/playlists/${id}/tracks`, { uris }, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    }),
  );
  return { ok: true, snapshot_id: res.data?.snapshot_id };
}

// Remove tracks by URI (optionally pass snapshot_id for concurrency)
async removeTracksFromPlaylistFromToken(
  token: string,
  id: string,
  uris: string[],
  snapshot_id?: string,
) {
  const body = {
    tracks: (uris || []).map((u) => ({ uri: u })),
    ...(snapshot_id ? { snapshot_id } : {}),
  };
  const res = await firstValueFrom(
    this.http.delete(`https://api.spotify.com/v1/playlists/${id}/tracks`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      data: body,
    }),
  );
  return { ok: true, snapshot_id: res.data?.snapshot_id };
}
}
