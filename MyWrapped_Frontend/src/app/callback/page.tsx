"use client";

import { useEffect, useState } from "react";
import { exchangeCodeForToken } from "@/utils/spotifyAuth";

export default function CallbackPage() {
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const runAuth = async () => {
            const urlParams = new URLSearchParams(window.location.search);
            const code = urlParams.get("code");
            const state = urlParams.get("state");

            if (!code || !state) {
                setError("Missing code or state");
                return;
            }

            try {
                const codeVerifier = atob(state); // decode back the codeVerifier

                const tokenResponse = await exchangeCodeForToken(code, codeVerifier);

                // Store the tokens
                localStorage.setItem("spotify_access_token", tokenResponse.access_token);
                localStorage.setItem("spotify_refresh_token", tokenResponse.refresh_token ?? "");

                // Redirect
                window.location.href = "/";
            } catch (err) {
                console.error(err);
                setError("Failed to get tokens");
            }
        };

        runAuth();
    }, []);

    return (
        <div>
            <h1>Authorizing with Spotify...</h1>
            {error && <p style={{ color: "red" }}>{error}</p>}
        </div>
    );
}
