"use client";

import React, { useState } from "react";
import Image from "next/image";
import styles from "@/app/search/search.module.scss";
import PlaylistSelector from "@/components/PlaylistSelector";

type Props = {
  item: any;
  token: string | null;
  formatDuration: (ms: number) => string;
};

export default function TrackResultItem({ item, token, formatDuration }: Props) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);

  return (
    <>
      <div className={styles.suggestionDetails}>
        <Image
          src={item.album?.images?.[2]?.url || "/placeholder.png"}
          alt="cover"
          width={40}
          height={40}
        />
        <div className={styles.trackInfo}>
          <strong>{item.name}</strong>
          <div>{item.artists?.map((a: any) => a.name).join(", ") || "Unknown artist"}</div>
          <div><em>{item.album?.name}</em></div>
          <div>{formatDuration(item.duration_ms)}</div>
        </div>
      </div>

      <button
        className={styles.addButton}
        onClick={(e) => {
          setOpen(true);
          setPos({ x: e.clientX, y: e.clientY });
        }}
      >
        Add to Playlist
      </button>

      {open && pos && (
        <PlaylistSelector
          token={token}
          trackUri={item.uri}
          onClose={() => setOpen(false)}
          style={{
            position: "fixed",
            left: `${pos.x}px`,
            top: `${pos.y}px`,
            zIndex: 2000,
          }}
        />
      )}
    </>
  );
}
