"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import styles from "./playlists.module.scss";
import PlaylistTable from "../../components/PlaylistTable";

type PlaylistItem = {
  id: string;
  name: string;
  images?: { url: string }[];
  owner?: { display_name: string };
  tracks?: { total: number };
};

export default function PlaylistPage() {
  const [token, setToken] = useState<string | null>(null);
  const [playlists, setPlaylists] = useState<PlaylistItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // UI
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"name" | "tracks">("name");

  useEffect(() => {
    setToken(localStorage.getItem("spotify_access_token"));
  }, []);

  useEffect(() => {
    if (!token) return;
    let aborted = false;

    (async () => {
      try {
        setLoading(true);
        setErr(null);
        const res = await fetch("http://localhost:3000/spotify/playlists", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          if (res.status === 401) throw new Error("You must connect to Spotify first.");
          throw new Error("Failed to fetch playlists.");
        }
        const data = await res.json();
        const items: PlaylistItem[] = Array.isArray(data) ? data : (data?.items ?? []);
        if (!aborted) setPlaylists(items);
      } catch (e: any) {
        if (!aborted) setErr(e.message || "Error loading playlists.");
      } finally {
        if (!aborted) setLoading(false);
      }
    })();

    return () => {
      aborted = true;
    };
  }, [token]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    const base = term
      ? playlists.filter(
          (p) =>
            (p.name || "").toLowerCase().includes(term) ||
            (p.owner?.display_name || "").toLowerCase().includes(term)
        )
      : playlists;

    return [...base].sort((a, b) => {
      if (sort === "name") return (a.name || "").localeCompare(b.name || "");
      const at = a.tracks?.total ?? 0;
      const bt = b.tracks?.total ?? 0;
      return bt - at;
    });
  }, [playlists, q, sort]);

  if (!token) {
    return (
      <div className={styles.container}>
        <div className={styles.infoCard}>
          <p>⚠️ You must connect to Spotify first.</p>
          <Link href="/" className={styles.linkBtn}>Go to Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.toolbar}>
        <h1>Playlists</h1>
        <div className={styles.controls}>
          <input
            className={styles.searchInput}
            placeholder="Search by name or owner…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <select
            className={styles.select}
            value={sort}
            onChange={(e) => setSort(e.target.value as any)}
            aria-label="Sort playlists"
          >
            <option value="name">Sort: Name</option>
            <option value="tracks">Sort: Tracks</option>
          </select>
        </div>
      </header>

      <PlaylistTable playlists={filtered} loading={loading} err={err} />
    </div>
  );
}
