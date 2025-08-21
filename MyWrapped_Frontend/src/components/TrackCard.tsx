"use client";

import React from "react";
import Image from 'next/image';
import styles from "./scss/TrackCard.module.scss";
import { formatDuration } from "@/utils/formatDuration";


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
            <Image
                src={image}
                alt={album}
                className={styles.albumCover}
                width={200}
                height={200}
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
