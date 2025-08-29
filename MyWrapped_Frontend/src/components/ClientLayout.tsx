// components/ClientLayout.tsx
"use client";
import { usePathname } from "next/navigation";
import Header from "@/components/Header";
import React from "react";
import PlaybackProvider from "@/components/PlaybackProvider";
import PlayerBar from "@/components/PlayerBar";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const hideHeader = pathname === "/";

    return (
        <PlaybackProvider>
            {/* Give the page some bottom padding so content isn’t hidden behind the bar */}
            <div className="page-shell">
                {!hideHeader && <Header />}
                {children}
            </div>

            <PlayerBar />
        </PlaybackProvider>
    );
}