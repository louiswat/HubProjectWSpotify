"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import styles from "./detail.module.scss";
import { formatDuration } from "@/utils/formatDuration";

type TrackRow = {
  position: number;
  id: string | undefined;
  uri: string | undefined;
  name: string | undefined;
  durationMs: number | undefined;
  explicit: boolean;
  album?: { id?: string; name?: string };
  artists: { id?: string; name?: string }[];
};

type PlaylistPayload = {
  id: string;
  name: string;
  description: string | null;
  images: { url: string }[];
  owner: { display_name: string };
  public: boolean;
  tracksTotal: number;
  tracks: TrackRow[];
  snapshotId?: string; // may be undefined on first fetch if backend didn't include; safe optional
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

  // local track order (we’ll persist on “Save order”)
  const [rows, setRows] = useState<TrackRow[]>([]);

  // read-only flag if user doesn't own the playlist
  const [canEdit, setCanEdit] = useState(true);

  useEffect(() => {
    setToken(localStorage.getItem("spotify_access_token"));
  }, []);

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
        // sort by position just in case
        const sorted = [...payload.tracks].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
        setRows(sorted);

        // client-side ownership check (read-only if not owner)
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
      // update UI
      setRows((prev) => prev.filter((_, i) => i !== index).map((r, i) => ({ ...r, position: i + 1 })));
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
          Authorization: `Bearer ${token}` },
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
    // Replace the playlist items with the current order (supports up to 100 URIs in one shot)
    const uris = rows.map((r) => r.uri).filter(Boolean) as string[];
    try {
      setSaving(true);
      setError(null);
      const res = await fetch(`http://localhost:3000/spotify/playlists/${playlistId}/replace`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` },
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
        <Image src={cover} alt="cover" width={128} height={128} className={styles.cover} unoptimized />
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
            <button className={styles.secondary} onClick={() => router.push("/playlists")} disabled={saving}>
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
                  <div className={styles.titleStack}>
                    <span className={styles.song}>{t.name || "Unknown"}</span>
                    {t.explicit && <span className={styles.explicit}>E</span>}
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
                <td colSpan={6} className={styles.empty}>No tracks.</td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      <footer className={styles.footerBar}>
        <button className={styles.primary} onClick={saveOrder} disabled={!canEdit || saving || rows.length === 0}>
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
