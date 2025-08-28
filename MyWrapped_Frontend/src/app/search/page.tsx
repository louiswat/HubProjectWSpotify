"use client";

import React, { useEffect, useState } from "react";
import styles from "./search.module.scss";
import { formatDuration } from "@/utils/formatDuration";
import TrackResultItem from "@/components/search/TrackResultItem";
import ArtistResultItem from "@/components/search/ArtistResultItem";
import ArtistTopModal from "@/components/search/ArtistTopModal";

export default function Search() {
    const [type, setType] = useState<"track" | "artist">("track");
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [token, setToken] = useState<string | null>(null);

    // follow state for artists
    const [followed, setFollowed] = useState<Record<string, boolean>>({});

    // modal state
    const [selectedArtist, setSelectedArtist] = useState<{ id: string; name: string } | null>(null);

    useEffect(() => {
        const storedToken = localStorage.getItem("spotify_access_token");
        if (storedToken) setToken(storedToken);
    }, []);

    // search
    useEffect(() => {
        if (!query || !token) {
            setResults([]);
            return;
        }

        const delay = setTimeout(() => {
            setLoading(true);
            fetch(`http://localhost:3000/spotify/search?query=${encodeURIComponent(query)}&type=${type}`, {
                headers: { Authorization: `Bearer ${token}` },
            })
                .then((res) => {
                    if (!res.ok) throw new Error("Backend error");
                    return res.json();
                })
                .then((data) => {
                    if (Array.isArray(data)) setResults(data);
                })
                .catch(console.error)
                .finally(() => setLoading(false));
        }, 300);

        return () => clearTimeout(delay);
    }, [query, type, token]);

    // clear results when switching type
    useEffect(() => {
        setResults([]);
    }, [type]);

    // check following when showing artist results
    useEffect(() => {
        if (!token || type !== "artist" || results.length === 0) {
            setFollowed({});
            return;
        }
        const ids = results.map((a: any) => a.id).filter(Boolean);
        const chunks: string[][] = [];
        for (let i = 0; i < ids.length; i += 50) chunks.push(ids.slice(i, i + 50));

        (async () => {
            try {
                const states: Record<string, boolean> = {};
                for (const chunk of chunks) {
                    const res = await fetch(
                        `http://localhost:3000/spotify/following/contains?type=artist&ids=${chunk.join(",")}`,
                        { headers: { Authorization: `Bearer ${token}` } }
                    );
                    if (!res.ok) throw new Error("follow check failed");
                    const arr: boolean[] = await res.json();
                    chunk.forEach((id, idx) => (states[id] = !!arr[idx]));
                }
                setFollowed(states);
            } catch (e) {
                console.error(e);
            }
        })();
    }, [token, type, results]);

    const toggleFollow = async (artistId: string) => {
        if (!token || !artistId) return;
        const isFollowing = !!followed[artistId];
        try {
            setFollowed((prev) => ({ ...prev, [artistId]: !isFollowing }));
            const method = isFollowing ? "DELETE" : "PUT";
            const res = await fetch(
                `http://localhost:3000/spotify/following?type=artist&ids=${artistId}`,
                { method, headers: { Authorization: `Bearer ${token}` } }
            );
            if (!res.ok) throw new Error("follow toggle failed");
        } catch (e) {
            console.error(e);
            setFollowed((prev) => ({ ...prev, [artistId]: isFollowing }));
        }
    };

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
                                <TrackResultItem
                                    item={item}
                                    token={token}
                                    formatDuration={formatDuration}
                                />
                            ) : (
                                <ArtistResultItem
                                    item={item}
                                    followed={!!followed[item.id]}
                                    onToggleFollow={() => toggleFollow(item.id)}
                                    onOpenTop={(artist) => setSelectedArtist(artist)}
                                />
                            )}
                        </li>
                    ))}
                </ul>
            )}

            {/* Top tracks modal */}
            <ArtistTopModal
                isOpen={!!selectedArtist}
                artist={selectedArtist}
                token={token}
                onClose={() => setSelectedArtist(null)}
                formatDuration={formatDuration}
            />
        </div>
    );
}
