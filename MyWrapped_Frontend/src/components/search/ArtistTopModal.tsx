"use client";

import React, { useEffect, useRef, useState } from "react";
import modalStyles from "./scss/ArtistTopModal.module.scss";
import PlaylistSelector from "@/components/PlaylistSelector";
import PlayableCover from "@/components/PlayableCover";

type TopTrack = {
    id: string;
    uri: string;
    name: string;
    duration_ms: number;
    album?: { images?: { url: string }[]; name?: string };
    artists?: { name: string }[];
};

type Props = {
    isOpen: boolean;
    artist: { id: string; name: string } | null;
    token: string | null;
    onClose: () => void;
    formatDuration: (ms: number) => string;
};

export default function ArtistTopModal({
    isOpen,
    artist,
    token,
    onClose,
    formatDuration,
}: Props) {
    const [tracks, setTracks] = useState<TopTrack[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const modalRef = useRef<HTMLDivElement | null>(null);
    const [selectorPos, setSelectorPos] = useState<{ x: number; y: number } | null>(null);
    const [activeUri, setActiveUri] = useState<string>("");

    useEffect(() => {
        if (!isOpen || !artist || !token) return;
        setLoading(true);
        setError(null);
        setTracks([]);

        fetch(`http://localhost:3000/spotify/artists/${artist.id}/top-tracks?market=US`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => {
                if (!res.ok) throw new Error("Failed to fetch top tracks");
                return res.json();
            })
            .then((data) => {
                const arr: TopTrack[] = Array.isArray(data) ? data : data?.tracks || [];
                setTracks(arr.slice(0, 10));
            })
            .catch((e) => setError(e?.message || "Error loading top tracks"))
            .finally(() => setLoading(false));
    }, [isOpen, artist, token]);

    // close on ESC
    useEffect(() => {
        if (!isOpen) return;
        const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [isOpen, onClose]);

    if (!isOpen || !artist) return null;

    return (
        <>
            <div className={modalStyles.modalOverlay} onClick={onClose} />
            <div
                className={modalStyles.modal}
                role="dialog"
                aria-modal="true"
                aria-label="Artist top tracks"
                ref={modalRef}
            >
                <div className={modalStyles.modalHeader}>
                    <h3 className={modalStyles.modalTitle}>Top tracks — {artist.name}</h3>
                    <button className={modalStyles.modalClose} onClick={onClose} aria-label="Close">
                        ✕
                    </button>
                </div>

                {loading && <p className={modalStyles.loading}>Loading…</p>}
                {error && <p className={modalStyles.error}>{error}</p>}

                {!loading && !error && (
                    <ul className={modalStyles.topTracksList}>
                        {tracks.map((t, idx) => {
                            const img = t.album?.images?.[2]?.url || t.album?.images?.[1]?.url || "/placeholder.png";
                            return (
                                <li key={t.id || idx} className={modalStyles.topTrackItem}>
                                    <div className={modalStyles.topTrackLeft}>
                                        <PlayableCover
                                            src={img || "/placeholder.png"}
                                            alt={t.name}
                                            size={56}
                                            uri={t.uri}
                                        />
                                        <div className={modalStyles.topTrackMeta}>
                                            <div className={modalStyles.topTrackName}>{t.name}</div>
                                            <div className={modalStyles.topTrackSub}>
                                                {(t.artists || []).map((a) => a.name).join(", ")} • {formatDuration(t.duration_ms || 0)}
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        className={modalStyles.addSmallButton}
                                        onClick={(e) => {
                                            setActiveUri(t.uri);
                                            const rect = modalRef.current?.getBoundingClientRect();
                                            const x = e.clientX - (rect?.left ?? 0);
                                            const y = e.clientY - (rect?.top ?? 0);
                                            setSelectorPos({ x, y });
                                        }}
                                    >
                                        Add
                                    </button>
                                </li>
                            );
                        })}
                        {tracks.length === 0 && <li className={modalStyles.topEmpty}>No tracks found.</li>}
                    </ul>
                )}

                {activeUri && selectorPos && (
                    <PlaylistSelector
                        token={token}
                        trackUri={activeUri}
                        onClose={() => setActiveUri("")}
                        style={{
                            position: "absolute",
                            left: `${selectorPos.x}px`,
                            top: `${selectorPos.y}px`,
                            zIndex: 110,
                            maxHeight: 280,
                            overflow: "auto",
                        }}
                    />
                )}
            </div>
        </>
    );
}
