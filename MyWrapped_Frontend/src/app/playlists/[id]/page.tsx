"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import styles from "./detail.module.scss";
import { formatDuration } from "@/utils/formatDuration";
import PlayableCover from "@/components/PlayableCover";

type TrackRow = {
  position: number;
  id?: string;
  uri?: string;
  name?: string;
  durationMs?: number;
  explicit: boolean;
  album?: { id?: string; name?: string };
  artists: { id?: string; name?: string }[];
  image?: string | null;
};

type PlaylistPayload = {
  id: string;
  uri?: string;
  name: string;
  description: string | null;
  images: { url: string }[];
  owner: { display_name: string };
  public: boolean;
  tracksTotal: number;
  tracks: TrackRow[];
  snapshotId?: string;
};

export default function PlaylistDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const playlistId = params?.id;

  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [data, setData] = useState<PlaylistPayload | null>(null);

  // local editable fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  // local track order
  const [rows, setRows] = useState<TrackRow[]>([]);

  // read-only flag if user doesn't own the playlist
  const [canEdit, setCanEdit] = useState(true);

  useEffect(() => {
    setToken(localStorage.getItem("spotify_access_token"));
  }, []);

  const hydrateImages = async (list: TrackRow[], auth: string): Promise<TrackRow[]> => {
    const need = list.filter((r) => !r.image);
    if (need.length === 0) return list;

    const trackIds = Array.from(new Set(need.map((r) => r.id).filter(Boolean))) as string[];
    const albumIds = Array.from(
      new Set(need.map((r) => r.album?.id).filter(Boolean))
    ) as string[];

    const imgByTrack: Record<string, string> = {};
    const imgByAlbum: Record<string, string> = {};

    // fetch tracks in chunks of 50
    for (let i = 0; i < trackIds.length; i += 50) {
      const ids = trackIds.slice(i, i + 50).join(",");
      try {
        const res = await fetch(`https://api.spotify.com/v1/tracks?ids=${ids}`, {
          headers: { Authorization: `Bearer ${auth}` },
        });
        if (res.ok) {
          const data = await res.json();
          (data.tracks || []).forEach((t: any) => {
            const img =
              t?.album?.images?.[2]?.url ||
              t?.album?.images?.[1]?.url ||
              t?.album?.images?.[0]?.url;
            if (t?.id && img) imgByTrack[t.id] = img;
          });
        }
      } catch {
      }
    }

    // fetch albums in chunks of 20 (Spotify limit)
    for (let i = 0; i < albumIds.length; i += 20) {
      const ids = albumIds.slice(i, i + 20).join(",");
      try {
        const res = await fetch(`https://api.spotify.com/v1/albums?ids=${ids}`, {
          headers: { Authorization: `Bearer ${auth}` },
        });
        if (res.ok) {
          const data = await res.json();
          (data.albums || []).forEach((a: any) => {
            const img = a?.images?.[2]?.url || a?.images?.[1]?.url || a?.images?.[0]?.url;
            if (a?.id && img) imgByAlbum[a.id] = img;
          });
        }
      } catch {
        // ignore
      }
    }

    return list.map((r) => {
      if (r.image) return r;
      const img = (r.id && imgByTrack[r.id]) || (r.album?.id && imgByAlbum[r.album.id]) || null;
      return { ...r, image: img };
    });
  };

  // initial fetch
  useEffect(() => {
    if (!token || !playlistId) return;
    (async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`http://localhost:3000/spotify/playlists/${playlistId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error(`Failed to load playlist (${res.status})`);
        const payload: PlaylistPayload = await res.json();

        setData(payload);
        setName(payload.name);
        setDescription(payload.description ?? "");

        // sort by position
        const sorted = [...payload.tracks].sort(
          (a, b) => (a.position ?? 0) - (b.position ?? 0)
        );

        // hydrate images once, then set rows
        const withImages = await hydrateImages(sorted, token);
        setRows(withImages);

        // ownership check (read-only if not owner)
        try {
          const [meRes, plRes] = await Promise.all([
            fetch("https://api.spotify.com/v1/me", {
              headers: { Authorization: `Bearer ${token}` },
            }),
            fetch(`https://api.spotify.com/v1/playlists/${playlistId}`, {
              headers: { Authorization: `Bearer ${token}` },
            }),
          ]);
          if (meRes.ok && plRes.ok) {
            const me = await meRes.json();
            const pl = await plRes.json();
            setCanEdit(Boolean(me?.id && pl?.owner?.id && me.id === pl.owner.id));
          } else {
            setCanEdit(false);
          }
        } catch {
          setCanEdit(false);
        }
      } catch (e: any) {
        setError(e.message || "Error loading playlist");
      } finally {
        setLoading(false);
      }
    })();
  }, [token, playlistId]);

  const cover = useMemo(() => data?.images?.[0]?.url || "/placeholder.png", [data]);
  const playlistUri = useMemo(
    () => data?.uri || (data?.id ? `spotify:playlist:${data.id}` : ""),
    [data]
  );

  const moveRow = (index: number, direction: "up" | "down") => {
    setRows((prev) => {
      const next = [...prev];
      if (direction === "up" && index > 0) {
        [next[index - 1], next[index]] = [next[index], next[index - 1]];
      } else if (direction === "down" && index < next.length - 1) {
        [next[index], next[index + 1]] = [next[index + 1], next[index]];
      }
      return next.map((r, i) => ({ ...r, position: i + 1 }));
    });
  };

  const removeRow = async (index: number) => {
    if (!token || !playlistId) return;
    const row = rows[index];
    if (!row?.uri) return;
    try {
      setSaving(true);
      setError(null);
      const res = await fetch(`http://localhost:3000/spotify/playlists/${playlistId}/tracks`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ uris: [row.uri] }),
      });
      if (!res.ok) throw new Error("Failed to remove track");
      setRows((prev) =>
        prev.filter((_, i) => i !== index).map((r, i) => ({ ...r, position: i + 1 }))
      );
    } catch (e: any) {
      setError(e.message || "Error removing track");
    } finally {
      setSaving(false);
    }
  };

  const saveDetails = async () => {
    if (!token || !playlistId) return;
    try {
      setSaving(true);
      setError(null);
      const res = await fetch(`http://localhost:3000/spotify/playlists/${playlistId}/details`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: name?.trim() || undefined,
          description: description ?? "",
        }),
      });
      if (!res.ok) throw new Error("Failed to update playlist details");
    } catch (e: any) {
      setError(e.message || "Error saving details");
    } finally {
      setSaving(false);
    }
  };

  const saveOrder = async () => {
    if (!token || !playlistId) return;
    const uris = rows.map((r) => r.uri).filter(Boolean) as string[];
    try {
      setSaving(true);
      setError(null);
      const res = await fetch(`http://localhost:3000/spotify/playlists/${playlistId}/replace`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ uris }),
      });
      if (!res.ok) throw new Error("Failed to save order");
    } catch (e: any) {
      setError(e.message || "Error saving order");
    } finally {
      setSaving(false);
    }
  };

  if (!token) {
    return (
      <div className={styles.container}>
        <p>⚠️ You must connect to Spotify first.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <p>Loading…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <p className={styles.error}>{error}</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <PlayableCover src={cover} alt={data.name} size={128} uri={playlistUri} />

        <div className={styles.meta}>
          <input
            className={styles.titleInput}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Playlist name"
            readOnly={!canEdit}
            disabled={!canEdit}
          />
          <textarea
            className={styles.descInput}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description"
            rows={3}
            readOnly={!canEdit}
            disabled={!canEdit}
          />
          <div className={styles.metaRow}>
            <span>By {data.owner?.display_name || "—"}</span>
            <span>• {rows.length} tracks</span>
          </div>
          <div className={styles.actions}>
            <button className={styles.primary} onClick={saveDetails} disabled={!canEdit || saving}>
              Save details
            </button>
            <button
              className={styles.secondary}
              onClick={() => router.push("/playlists")}
              disabled={saving}
            >
              Back
            </button>
          </div>
        </div>
      </header>

      <section className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.posCol}>#</th>
              <th>Title</th>
              <th className={styles.artistCol}>Artists</th>
              <th className={styles.albumCol}>Album</th>
              <th className={styles.timeCol}>Time</th>
              <th className={styles.actCol}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((t, i) => (
              <tr key={`${t.id}-${i}`}>
                <td>{i + 1}</td>
                <td className={styles.titleCell}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <PlayableCover
                      src={t.image || "/placeholder.png"}
                      alt={t.name || ""}
                      size={56}
                      uri={t.uri || ""}
                    />
                    <div style={{ minWidth: 0 }}>
                      <span className={styles.song}>{t.name || "Unknown"}</span>
                      {t.explicit && <span className={styles.explicit}>E</span>}
                    </div>
                  </div>
                </td>
                <td className={styles.artistCell}>
                  {t.artists?.map((a) => a.name).filter(Boolean).join(", ") || "—"}
                </td>
                <td className={styles.albumCell}>{t.album?.name || "—"}</td>
                <td className={styles.timeCell}>{formatDuration(t.durationMs || 0)}</td>
                <td className={styles.actionsCell}>
                  <div className={styles.rowActions}>
                    <button
                      className={styles.smallBtn}
                      onClick={() => moveRow(i, "up")}
                      disabled={!canEdit || i === 0 || saving}
                      title="Move up"
                    >
                      ↑
                    </button>
                    <button
                      className={styles.smallBtn}
                      onClick={() => moveRow(i, "down")}
                      disabled={!canEdit || i === rows.length - 1 || saving}
                      title="Move down"
                    >
                      ↓
                    </button>
                    <button
                      className={styles.dangerSmall}
                      onClick={() => removeRow(i)}
                      disabled={!canEdit || saving}
                      title="Remove"
                    >
                      Remove
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className={styles.empty}>
                  No tracks.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      <footer className={styles.footerBar}>
        <button
          className={styles.primary}
          onClick={saveOrder}
          disabled={!canEdit || saving || rows.length === 0}
        >
          Save order
        </button>
        <a
          className={styles.secondary}
          href={`https://open.spotify.com/playlist/${data.id}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          Open in Spotify
        </a>
      </footer>
    </div>
  );
}
