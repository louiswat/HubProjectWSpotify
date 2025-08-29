"use client";

import React from "react";
import Link from "next/link";
import styles from "./scss/PlaylistTable.module.scss";
import PlayableCover from "@/components/PlayableCover";

type PlaylistItem = {
  id: string;
  name: string;
  images?: { url: string }[];
  owner?: { display_name: string };
  tracks?: { total: number };
  uri?: string;
};

export default function PlaylistTable({
  playlists,
  loading,
  err,
}: {
  playlists: PlaylistItem[];
  loading: boolean;
  err: string | null;
}) {
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.coverCol}>Cover</th>
            <th>Name</th>
            <th className={styles.ownerCol}>Owner</th>
            <th className={styles.tracksCol}>Tracks</th>
          </tr>
        </thead>
        <tbody>
          {loading && (
            <tr>
              <td colSpan={4} className={styles.stateRow}>Loading…</td>
            </tr>
          )}

          {err && !loading && (
            <tr>
              <td colSpan={4} className={styles.stateRowError}>{err}</td>
            </tr>
          )}

          {!loading && !err && playlists.length === 0 && (
            <tr>
              <td colSpan={4} className={styles.stateRow}>No playlists found.</td>
            </tr>
          )}

          {!loading && !err && playlists.map((p) => {
            const img = p.images?.[0]?.url || "/placeholder.png";
            return (
              <tr key={p.id} className={styles.row}>
                <td>
                  <PlayableCover
                    src={img}
                    alt={p.name}
                    size={56}
                    contextUri={`spotify:playlist:${p.id}`}
                  />
                </td>
                <td className={styles.nameCell}>
                  <Link href={`/playlists/${p.id}`} className={styles.nameLink}>
                    {p.name || "Untitled"}
                  </Link>
                </td>
                <td className={styles.ownerCell}>{p.owner?.display_name || "—"}</td>
                <td className={styles.tracksCell}>{p.tracks?.total ?? 0}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
