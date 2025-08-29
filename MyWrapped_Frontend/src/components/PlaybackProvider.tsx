"use client";
import React, {
    createContext,
    useContext,
    useEffect,
    useRef,
    useState,
    useCallback,
} from "react";

type PlaybackContextValue = {
    isReady: boolean;
    isPlaying: boolean;
    track: {
        id?: string;
        name?: string;
        artists?: string;
        image?: string;
    } | null;
    progressMs: number;
    durationMs: number;
    deviceId: string | null;
    volume: number;
    playTrack: (uri: string, positionMs?: number) => Promise<void>;
    playContext: (contextUri: string, offset?: number) => Promise<void>;
    toggle: () => Promise<void>;
    next: () => Promise<void>;
    prev: () => Promise<void>;
    setVolume: (v: number) => Promise<void>; // 0..1
    seek?: (ms: number) => Promise<void>;
};

const PlaybackContext = createContext<PlaybackContextValue | null>(null);
export const usePlayback = () => useContext(PlaybackContext)!;

export default function PlaybackProvider({ children }: { children: React.ReactNode }) {
    const [deviceId, setDeviceId] = useState<string | null>(null);
    const [isReady, setIsReady] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [track, setTrack] = useState<PlaybackContextValue["track"]>(null);
    const [progressMs, setProgressMs] = useState(0);
    const [durationMs, setDurationMs] = useState(0);
    const [volume, setVolumeState] = useState(0.8);

    const tokenRef = useRef<string | null>(null);
    const playerRef = useRef<Spotify.Player | null>(null);

    useEffect(() => {
        tokenRef.current = localStorage.getItem("spotify_access_token");
    }, []);

    // Load Spotify Web Playback SDK
    useEffect(() => {
        if (typeof window === "undefined") return;
        if ((window as any).Spotify) {
            init();
            return;
        }
        const script = document.createElement("script");
        script.src = "https://sdk.scdn.co/spotify-player.js";
        script.async = true;
        document.body.appendChild(script);
        (window as any).onSpotifyWebPlaybackSDKReady = init;
    }, []);

    const init = () => {
        const Spotify = (window as any).Spotify as typeof window.Spotify | undefined;
        if (!Spotify) return;

        const player = new Spotify.Player({
            name: "MyWrapped Web Player",
            getOAuthToken: (cb: (t: string) => void) => cb(tokenRef.current || ""),
            volume,
        });

        playerRef.current = player;

        player.addListener("ready", async ({ device_id }: any) => {
            setDeviceId(device_id);
            setIsReady(true);
            await transferToDevice(device_id);
            try {
                const v = await player.getVolume();
                if (typeof v === "number") setVolumeState(v);
            } catch { }
        });

        player.addListener("player_state_changed", (state: any) => {
            if (!state) return;
            setIsPlaying(!state.paused);
            setProgressMs(state.position || 0);
            setDurationMs(state.duration || 0);
            const current = state.track_window?.current_track;
            if (current) {
                setTrack({
                    id: current.id,
                    name: current.name,
                    artists: (current.artists || []).map((a: any) => a.name).join(", "),
                    image: current.album?.images?.[0]?.url,
                });
            }
        });

        player.addListener("not_ready", () => setIsReady(false));
        player.connect();
    };

    const getHeaders = useCallback(() => {
        const tok = localStorage.getItem("spotify_access_token") || tokenRef.current || "";
        return {
            Authorization: `Bearer ${tok}`,
            "Content-Type": "application/json",
        };
    }, []);

    const transferToDevice = async (id: string) => {
        await fetch("http://localhost:3000/spotify/player/transfer", {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify({ device_id: id }),
        }).catch(() => { });
    };

    const playTrack = async (uri: string, positionMs = 0) => {
        if (!deviceId) return;
        await fetch("http://localhost:3000/spotify/player/play", {
            method: "PUT",
            headers: getHeaders(),
            body: JSON.stringify({
                device_id: deviceId,
                uris: [uri],
                position_ms: positionMs,
            }),
        });
    };

    const playContext = async (contextUri: string, offset = 0) => {
        if (!deviceId) return;
        await fetch(
            `http://localhost:3000/spotify/player/play?device_id=${encodeURIComponent(deviceId)}`,
            {
                method: "PUT",
                headers: getHeaders(),
                body: JSON.stringify({
                    context_uri: contextUri,
                    offset: { position: Math.max(0, Number(offset) || 0) },
                    position_ms: 0,
                }),
            }
        );
    };

    const toggle = async () => {
        if (isPlaying) {
            await fetch("http://localhost:3000/spotify/player/pause", {
                method: "PUT",
                headers: getHeaders(),
                body: JSON.stringify({ device_id: deviceId }),
            });
        } else {
            await fetch("http://localhost:3000/spotify/player/play", {
                method: "PUT",
                headers: getHeaders(),
                body: JSON.stringify({ device_id: deviceId }),
            });
        }
    };

    const next = async () => {
        await fetch("http://localhost:3000/spotify/player/next", {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify({ device_id: deviceId }),
        });
    };

    const prev = async () => {
        await fetch("http://localhost:3000/spotify/player/previous", {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify({ device_id: deviceId }),
        });
    };

    const setVolume = async (v: number) => {
        setVolumeState(v);
        try {
            await fetch("http://localhost:3000/spotify/player/volume", {
                method: "PUT",
                headers: getHeaders(),
                body: JSON.stringify({ volume_percent: Math.round(v * 100) }),
            });
        } finally {
            try {
                await playerRef.current?.setVolume(v);
            } catch { }
        }
    };

    const seek = async (ms: number) => {
        try {
            if (playerRef.current && typeof playerRef.current.seek === "function") {
                await playerRef.current.seek(ms);
            } else {
                // Backend proxy first
                const res = await fetch("http://localhost:3000/spotify/player/seek", {
                    method: "PUT",
                    headers: getHeaders(),
                    body: JSON.stringify({
                        position_ms: Math.max(0, Math.floor(ms)),
                        device_id: deviceId || undefined,
                    }),
                });
                if (!res.ok) {
                    const tok = localStorage.getItem("spotify_access_token") || tokenRef.current || "";
                    const q = new URLSearchParams({
                        position_ms: String(Math.max(0, Math.floor(ms))),
                    });
                    if (deviceId) q.set("device_id", deviceId);
                    await fetch(`https://api.spotify.com/v1/me/player/seek?${q.toString()}`, {
                        method: "PUT",
                        headers: { Authorization: `Bearer ${tok}` },
                    });
                }
            }
            setProgressMs(ms);
        } catch (e) {
            console.error("seek failed", e);
        }
    };

    useEffect(() => {
        if (!isPlaying || !durationMs) return;
        const id = setInterval(() => {
            setProgressMs((p) => Math.min(p + 500, durationMs));
        }, 500);
        return () => clearInterval(id);
    }, [isPlaying, durationMs]);

    const value: PlaybackContextValue = {
        isReady,
        isPlaying,
        track,
        progressMs,
        durationMs,
        deviceId,
        volume,
        playTrack,
        playContext,
        toggle,
        next,
        prev,
        setVolume,
        seek,
    };

    return <PlaybackContext.Provider value={value}>{children}</PlaybackContext.Provider>;
}
