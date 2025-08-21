"use client";
import React, { useEffect, useState } from "react";
import styles from "./scss/PlaylistSelector.module.scss";
import { getUserPlaylists, addTrackToPlaylist } from "@/utils/spotify";

interface PlaylistSelectorProps {
    token: string | null;
    trackUri: string;
    onClose: () => void;
    style?: React.CSSProperties;
}

export default function PlaylistSelector({ token, trackUri, onClose, style }: PlaylistSelectorProps) {
    const [playlists, setPlaylists] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        getUserPlaylists(token)
            .then(setPlaylists)
            .catch(() => setError("Could not load playlists"))
            .finally(() => setLoading(false));
    }, [token]);

    const handleAdd = async (playlistId: string) => {
        try {
            await addTrackToPlaylist(playlistId, trackUri, token);
            onClose();
        } catch {
            setError("Failed to add track");
        }
    };

    return (
        <div className={styles.popup} style={style}>
            <button className={styles.close} onClick={onClose}>X</button>
            {loading && <p>Loading...</p>}
            {error && <p className={styles.error}>{error}</p>}
            <ul className={styles.playlistList}>
                {playlists.map((p) => (
                    <li key={p.id} onClick={() => handleAdd(p.id)}>
                        {p.name}
                    </li>
                ))}
            </ul>
        </div>
    );
}
