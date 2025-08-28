"use client";

import React from "react";
import Image from "next/image";
import styles from "@/app/search/search.module.scss";

type Props = {
  item: any;
  followed: boolean;
  onToggleFollow: () => void;
  onOpenTop: (artist: { id: string; name: string }) => void;
};

export default function ArtistResultItem({
  item,
  followed,
  onToggleFollow,
  onOpenTop,
}: Props) {
  return (
    <div className={styles.suggestionDetails}>
      <Image
        src={item.images?.[2]?.url || "/placeholder.png"}
        alt="artist"
        width={40}
        height={40}
      />
      <div className={styles.trackInfo}>
        <button
          className={styles.artistNameButton}
          onClick={() => onOpenTop({ id: item.id, name: item.name })}
          title="Show top tracks"
        >
          {item.name}
        </button>

        {/* Heart (follow) */}
        <button
          type="button"
          className={`${styles.followBtn} ${followed ? styles.following : ""}`}
          title={followed ? "Unfollow" : "Follow"}
          aria-pressed={followed}
          onClick={(e) => {
            e.stopPropagation();
            onToggleFollow();
          }}
        >
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path d="M12 21s-6.716-4.42-9.293-7.293C.82 11.82.82 8.68 2.707 6.793 4.595 4.905 7.734 4.905 9.621 6.793L12 9.172l2.379-2.379c1.887-1.888 5.026-1.888 6.914 0 1.887 1.887 1.887 5.026 0 6.914C18.716 16.58 12 21 12 21z" />
          </svg>
        </button>

        {/* Open in Spotify */}
        <a
          href={item.external_urls.spotify}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.spotifyLink}
        >
          Open in Spotify
        </a>

        <div>{item.followers?.total?.toLocaleString?.() || 0} followers</div>
      </div>
    </div>
  );
}
