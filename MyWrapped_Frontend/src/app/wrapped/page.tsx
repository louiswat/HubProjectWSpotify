"use client";

import React, { useEffect, useState } from "react";
import TrackCard from "@/components/TrackCard";
import ArtistCard from "@/components/ArtistCard";
import styles from "./wrapped.module.scss";
import { useRouter } from "next/navigation";

export default function WrappedPage() {
    const [token, setToken] = useState<string | null>(null);
    const [type, setType] = useState<"tracks" | "artists">("tracks");
    const [tracks, setTracks] = useState([]);
    const [artists, setArtists] = useState([]);
    const [timeRange, setTimeRange] = useState<"short_term" | "medium_term" | "long_term">("medium_term");

    const router = useRouter();

    useEffect(() => {
        const accessToken = localStorage.getItem("spotify_access_token");
        if (!accessToken) {
            router.push("/?error=not-logged");
            return;
        }

        setToken(accessToken);

        // Optional: send token to backend to fetch profile (optional if backend stores userId/token)
        fetch("http://localhost:3000/spotify/profile", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ token: accessToken }),
        })
            .then((res) => {
                if (!res.ok) throw new Error("Failed to send token");
                return res.json();
            })
            .catch((err) => {
                console.error(err);
                router.push("/?error=auth-failed");
            });
    }, []);

    useEffect(() => {
        if (!token) return;

        fetch(`http://localhost:3000/spotify/top?type=${type}&timeRange=${timeRange}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
            .then((res) => {
                if (!res.ok) throw new Error("Backend error");
                return res.json();
            })
            .then((data) => {
                if (!data || !Array.isArray(data)) return;
                const sorted = data.sort((a: any, b: any) => b.popularity - a.popularity);
                type === "tracks" ? setTracks(sorted) : setArtists(sorted);
            })
            .catch((err) => {
                console.error("Failed to fetch wrapped data:", err);
            });
    }, [token, type, timeRange]);

    if (!token) {
        return <p>Loading...</p>;
    }

    return (
        <div className="card-container">
            <div className={styles.filters}>
                <div className={styles.toggleGroupTop}>
                    <button onClick={() => setType("tracks")} className={type === "tracks" ? styles.activeButton : ""}>
                        Tracks
                    </button>
                    <button onClick={() => setType("artists")} className={type === "artists" ? styles.activeButton : ""}>
                        Artists
                    </button>
                </div>

                <div className={styles.toggleGroupLeft}>
                    {["short_term", "medium_term", "long_term"].map((range) => (
                        <button
                            key={range}
                            onClick={() => setTimeRange(range as any)}
                            className={timeRange === range ? styles.activeButton : ""}
                        >
                            {range.replace("_", " ").replace(/(^\w)/, (m) => m.toUpperCase())}
                        </button>
                    ))}
                </div>
            </div>

            {type === "tracks" && tracks.length > 0 && (
                <div className={styles.cardContainer}>
                    {tracks.map((track, i) => (
                        <TrackCard
                            key={i}
                            name={track.name}
                            artist={track.artists[0].name}
                            album={track.album.name}
                            image={track.album.images?.[1]?.url}
                            spotifyUrl={track.external_urls.spotify}
                            duration={track.duration_ms}
                            popularity={track.popularity}
                        />
                    ))}
                </div>
            )}

            {type === "artists" && artists.length > 0 && (
                <div className={styles.cardContainer}>
                    {artists.map((artist, i) => (
                        <ArtistCard
                            key={i}
                            artist={artist.name}
                            image={
                                artist.images?.[1]?.url ||
                                artist.images?.[0]?.url ||
                                "/placeholder.jpg"
                            }
                            followers={artist.followers.total}
                            spotifyUrl={artist.external_urls.spotify}
                            popularity={artist.popularity}
                            genre={artist.genres}
                        />
                    ))}
                </div>
            )}

            {(type === "tracks" && tracks.length === 0) || (type === "artists" && artists.length === 0) ? (
                <p>No {type} found for this time range.</p>
            ) : null}
        </div>
    );
}
