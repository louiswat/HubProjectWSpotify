import { Injectable, HttpException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class PlayerService {
  constructor(private readonly http: HttpService) {}

  private headers(auth?: string) {
    if (!auth) throw new HttpException('Missing Authorization header', 401);
    return { Authorization: auth, 'Content-Type': 'application/json' };
  }

  async transfer(auth: string, deviceId: string, play?: boolean) {
    const res = await firstValueFrom(
      this.http.put(
        'https://api.spotify.com/v1/me/player',
        { device_ids: [deviceId], ...(typeof play === 'boolean' ? { play } : {}) },
        { headers: this.headers(auth) },
      ),
    );
    return res.data ?? { ok: true };
  }

  async play(auth: string, body: any) {
    const res = await firstValueFrom(
      this.http.put(
        'https://api.spotify.com/v1/me/player/play',
        body ?? {},
        { headers: this.headers(auth) },
      ),
    );
    return res.data ?? { ok: true };
  }

  async pause(auth: string) {
    const res = await firstValueFrom(
      this.http.put(
        'https://api.spotify.com/v1/me/player/pause',
        {},
        { headers: this.headers(auth) },
      ),
    );
    return res.data ?? { ok: true };
  }

  async next(auth: string) {
    const res = await firstValueFrom(
      this.http.post(
        'https://api.spotify.com/v1/me/player/next',
        {},
        { headers: this.headers(auth) },
      ),
    );
    return res.data ?? { ok: true };
  }

  async previous(auth: string) {
    const res = await firstValueFrom(
      this.http.post(
        'https://api.spotify.com/v1/me/player/previous',
        {},
        { headers: this.headers(auth) },
      ),
    );
    return res.data ?? { ok: true };
  }

  async volume(auth: string, percent: number) {
    const clamped = Math.max(0, Math.min(100, Math.round(percent)));
    const res = await firstValueFrom(
      this.http.put(
        'https://api.spotify.com/v1/me/player/volume',
        null, // must be null; Spotify reads query params
        { headers: { Authorization: auth }, params: { volume_percent: clamped } },
      ),
    );
    return res.data ?? { ok: true };
  }
}
