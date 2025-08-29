"use client";

import React from "react";
import styles from "./scss/TrackCard.module.scss";
import { formatDuration } from "@/utils/formatDuration";
import PlayableCover from "@/components/PlayableCover";


interface TrackCardProps {
    name: string;
    artist: string;
    album: string;
    image: string;
    spotifyUrl: string;
    duration: number;
    popularity: number;
}

export default function TrackCard({
    name,
    artist,
    album,
    image,
    spotifyUrl,
    duration,
    popularity
}: TrackCardProps) {

    // convert duration from ms to mm:ss
    const formattedDuration = formatDuration(duration);

    return (
        <div className={styles.TrackCard}>
            <PlayableCover
                src={image || "/placeholder.png"}
                alt={name}
                size={200}
                uri={spotifyUrl}
            />
            <div className={styles.trackInfo}>
                <div className={styles.trackName}>{name}</div>
                <div className={styles.artist}>{artist}</div>
                <div>Album: {album}</div>
                <div>Duration: {formattedDuration}</div>
                <div>Popularity: {popularity}/100</div>
                <a href={spotifyUrl} target="_blank" rel="noopener noreferrer" className={styles.spotifyLink}>
                    Open in Spotify
                </a>
            </div>
        </div>
    );
}
