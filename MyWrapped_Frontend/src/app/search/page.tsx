"use client";

import React, { useState, useEffect } from "react";
import styles from "./search.module.scss";
import Image from "next/image";
import { formatDuration } from "@/utils/formatDuration";
import PlaylistSelector from "@/components/PlaylistSelector";

export default function Search() {
    const [type, setType] = useState<"track" | "artist">("track");
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [token, setToken] = useState<string | null>(null);
    const [activeTrack, setActiveTrack] = useState("");
    const [selectorPosition, setSelectorPosition] = useState<{ x: number; y: number } | null>(null);

    // Load the token once on mount
    useEffect(() => {
        const storedToken = localStorage.getItem("spotify_access_token");
        if (storedToken) {
            setToken(storedToken);
        }
    }, []);

    // handle search
    useEffect(() => {
        if (!query || !token) {
            setResults([]);
            return;
        }

        const delay = setTimeout(() => {
            setLoading(true);
            fetch(`http://localhost:3000/spotify/search?query=${query}&type=${type}`, {
                headers: { Authorization: `Bearer ${token}` },
            })
                .then((res) => {
                    if (!res.ok) throw new Error("Backend error");
                    return res.json();
                })
                .then((data) => {
                    if (!Array.isArray(data)) return;
                    setResults(data);
                })
                .catch(console.error)
                .finally(() => setLoading(false));
        }, 300);

        return () => clearTimeout(delay);
    }, [query, type, token]);

    useEffect(() => {
        setResults([]);
    }, [type]);

    return (
        <div className={styles.searchContainer}>
            <div className={styles.filters}>
                <div className={styles.toggleGroupTop}>
                    <button
                        onClick={() => setType("track")}
                        className={type === "track" ? styles.activeButton : ""}
                    >
                        Tracks
                    </button>
                    <button
                        onClick={() => setType("artist")}
                        className={type === "artist" ? styles.activeButton : ""}
                    >
                        Artists
                    </button>
                </div>
            </div>

            <input
                type="text"
                placeholder={`Search for ${type}...`}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className={styles.searchInput}
            />

            {loading && <p className={styles.loading}>Loading...</p>}

            {results.length > 0 && (
                <ul className={styles.suggestions}>
                    {results.map((item) => (
                        <li key={item.id} className={styles.suggestionItem}>
                            {type === "track" ? (
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
                                            setActiveTrack(item.uri);
                                            setSelectorPosition({ x: e.clientX, y: e.clientY });
                                        }}
                                    >
                                        Add to Playlist
                                    </button>
                                    {activeTrack === item.uri && selectorPosition && (
                                        <PlaylistSelector
                                            token={token}
                                            trackUri={item.uri}
                                            onClose={() => setActiveTrack("")}
                                            style={{
                                                position: "absolute",
                                                left: `${selectorPosition.x}px`,
                                                top: `${selectorPosition.y}px`,
                                                zIndex: 1000,
                                            }}
                                        />
                                    )}
                                </>
                            ) : (
                                <>
                                    <div className={styles.suggestionDetails}>
                                        <Image
                                            src={item.images?.[2]?.url || "/placeholder.png"}
                                            alt="artist"
                                            width={40}
                                            height={40}
                                        />
                                        <div className={styles.trackInfo}>
                                            <strong>{item.name}</strong>
                                            <a href={item.external_urls.spotify} target="_blank" className={styles.spotifyLink}>Open in Spotify</a>
                                            <div>{item.followers?.total.toLocaleString()} followers</div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
