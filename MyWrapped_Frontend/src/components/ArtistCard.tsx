"use client";

import React from "react";
import Image from 'next/image';
import styles from "./scss/ArtistCard.module.scss";

interface ArtistCardProps {
    artist: string;
    image: string;
    followers: number;
    popularity: number;
    spotifyUrl: string;
    genre: []
}

export default function ArtistCard({
    artist,
    image,
    followers,
    popularity,
    spotifyUrl,
    genre,
}: ArtistCardProps) {
    return (
        <div className={styles.artistCard}>
            <Image
                src={image}
                alt={`${artist} profile`}
                className={styles.artistImage}
                width={200}
                height={200}
            />
            <div className={styles.info}>
                <h3 className={styles.artistName}>{artist}</h3>
                <p>{followers.toLocaleString()} followers</p>
                <p>Popularity: {popularity}/100</p>
                <a href={spotifyUrl} target="_blank" className={styles.spotifyLink}>Open in Spotify</a>
                {genre.length > 0 && (
                <p>Genres: {genre}</p>
                )}
            </div>
        </div>
    );
}
