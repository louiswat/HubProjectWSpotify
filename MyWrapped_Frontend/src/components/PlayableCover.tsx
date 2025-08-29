"use client";

import React from "react";
import Image from "next/image";
import { usePlayback } from "@/components/PlaybackProvider";

type Props =
  | {
      src: string;
      alt?: string;
      size?: number;
      uri: string;
      contextUri?: never;
    }
  | {
      src: string;
      alt?: string;
      size?: number;
      contextUri: string;
      uri?: never;
    };

export default function PlayableCover({ src, alt, size = 160, uri, contextUri }: Props) {
  const { playTrack, playContext } = usePlayback();

  const onPlay = () => {
    if (uri) return playTrack(uri);
    if (contextUri) return playContext(contextUri);
  };

  return (
    <div className="playableCover" style={{ width: size, height: size }}>
      <Image
        src={src || "/placeholder.png"}
        alt={alt || ""}
        width={size}
        height={size}
      />
      <div className="overlay">
        <button className="playBtn" onClick={onPlay} aria-label="Play">▶</button>
      </div>
    </div>
  );
}
