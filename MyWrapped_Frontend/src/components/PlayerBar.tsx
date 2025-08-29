"use client";
import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { usePlayback } from "./PlaybackProvider";
import styles from "./scss/playerbar.module.scss";

function fmt(ms?: number) {
  if (!ms || ms < 0) return "0:00";
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r < 10 ? "0" : ""}${r}`;
}

export default function PlayerBar() {
  const {
    track,
    isPlaying,
    toggle,
    next,
    prev,
    progressMs,
    durationMs,
    volume,
    setVolume,
    seek,
  } = usePlayback();

  const [scrubbing, setScrubbing] = useState(false);
  const [scrubMs, setScrubMs] = useState<number | null>(null);

  const sliderValue = useMemo(() => {
    if (!durationMs) return 0;
    return scrubbing && scrubMs != null ? scrubMs : progressMs;
  }, [scrubbing, scrubMs, progressMs, durationMs]);

  const commitSeek = async (val: number | null) => {
    if (!durationMs || val == null) return;
    try {
      await seek?.(val);
    } finally {
      setScrubbing(false);
      setScrubMs(null);
    }
  };

  useEffect(() => {
    if (!scrubbing) return;
    const up = () => commitSeek(scrubMs);
    window.addEventListener("mouseup", up, { once: true });
    window.addEventListener("touchend", up, { once: true });
    return () => {
      window.removeEventListener("mouseup", up);
      window.removeEventListener("touchend", up);
    };
  }, [scrubbing, scrubMs, durationMs]);

  // Mute helper
  const [muted, setMuted] = useState(false);
  const [preMute, setPreMute] = useState(volume || 0.8);
  const onMuteToggle = () => {
    if (!muted) {
      setPreMute(volume);
      setVolume(0);
      setMuted(true);
    } else {
      setVolume(preMute || 0.8);
      setMuted(false);
    }
  };

  return (
    <div className={styles.bar} aria-live="polite">
      <div className={styles.left}>
        {track?.image ? (
          <Image src={track.image} alt="" width={48} height={48} className={styles.cover} unoptimized />
        ) : (
          <div className={styles.coverPlaceholder} />
        )}
        <div className={styles.meta}>
          <div className={styles.title}>{track?.name || "Nothing playing"}</div>
          <div className={styles.artist}>{track?.artists || ""}</div>
        </div>
      </div>

      <div className={styles.center}>
        <div className={styles.controls}>
          <button className={styles.small} onClick={prev} title="Previous" aria-label="Previous track">⏮</button>
          <button
            className={styles.play}
            onClick={toggle}
            title={isPlaying ? "Pause" : "Play"}
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? "⏸" : "▶️"}
          </button>
          <button className={styles.small} onClick={next} title="Next" aria-label="Next track">⏭</button>
        </div>

        <div className={styles.timeline}>
          <span className={styles.time}>{fmt(sliderValue || 0)}</span>
          <input
            className={styles.seek}
            type="range"
            min={0}
            max={durationMs || 0}
            step={250}
            value={durationMs ? sliderValue || 0 : 0}
            onMouseDown={() => setScrubbing(true)}
            onTouchStart={() => setScrubbing(true)}
            onChange={(e) => setScrubMs(Number(e.target.value))}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitSeek(scrubMs);
            }}
            aria-label="Seek"
            disabled={!durationMs}
            // pretty fill
            style={
              {
                ["--_pct" as any]: `${
                  durationMs ? Math.min(100, Math.max(0, (sliderValue / durationMs) * 100)) : 0
                }%`,
              } as React.CSSProperties
            }
          />
          <span className={styles.time}>{fmt(durationMs || 0)}</span>
        </div>
      </div>

      <div className={styles.right}>
        <button
          className={styles.small}
          onClick={onMuteToggle}
          title={muted || volume === 0 ? "Unmute" : "Mute"}
          aria-label={muted || volume === 0 ? "Unmute" : "Mute"}
        >
          {muted || volume === 0 ? "🔇" : "🔊"}
        </button>
        <input
          className={styles.volume}
          type="range"
          min={0}
          max={100}
          step={1}
          value={Math.round((muted ? 0 : volume) * 100)}
          onChange={(e) => {
            const v = Number(e.target.value) / 100;
            setVolume(v);
            if (muted && v > 0) setMuted(false);
          }}
          aria-label="Volume"
        />
      </div>
    </div>
  );
}
