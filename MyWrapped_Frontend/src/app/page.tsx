"use client"

import React, { useEffect, useState } from "react";
import styles from "./home.module.scss";
import { buildSpotifyAuthUrl } from "@/utils/spotifyAuth";
import { useDarkMode } from "@/utils/useDarkMode";
import { useRouter } from "next/navigation";
import { sendTokenToBackend } from "@/utils/spotify";

export default function HomePage() {
  const [token, setToken] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [error, setError] = useState<string | null>(null); // holds which card failed
  const { isDark, toggleDarkMode } = useDarkMode();
  const router = useRouter();

  const handleLogin = async () => {
    const { url } = await buildSpotifyAuthUrl();
    window.location.href = url;
  };

  const handleLogout = () => {
    localStorage.removeItem("spotify_access_token");
    localStorage.removeItem("spotify_refresh_token");
    window.location.href = "/";
  };

  const handleProtectedNavigation = (path: string, key: string) => {
    if (!token) {
      setError(key); // 'wrapped', 'search', 'playlists'
    } else {
      router.push(path);
    }
  };

  useEffect(() => {
    const accessToken = localStorage.getItem("spotify_access_token");
    setToken(accessToken);

    if (!accessToken) return;

    (async () => {
      try {
        const res = await fetch("https://api.spotify.com/v1/me", {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!res.ok) throw new Error("Failed to fetch profile");

        const data = await res.json();
        setProfile(data);

        await sendTokenToBackend(data.id, accessToken);
      } catch (err) {
        console.error(err);
        setProfile(null);
      }
    })();
  }, []);


  return (
    <main className={styles.home}>
      <button onClick={toggleDarkMode} className={styles.darkModeButton}>
        {isDark ? "☀️" : "🌙"}
      </button>

      <section className={styles.hero}>
        <h1>Welcome to MyWrapped</h1>
        <p>Your personalized Spotify dashboard. Discover your listening trends, manage playlists, and find new music.</p>

        {!token && (
          <button onClick={handleLogin} className={styles.primaryButton}>
            Connect with Spotify
          </button>
        )}
        {token && profile && (
          <>
            <p>Logged in as {profile.display_name}</p>
            <button onClick={handleLogout} className={styles.button}>
              Logout
            </button>
          </>
        )}
      </section>

      <section className={styles.features}>
        <div className={styles.featureCard}>
          <h2>🎧 Wrapped</h2>
          <p>See your top tracks and artists over different time periods.</p>
          <button onClick={() => handleProtectedNavigation("/wrapped", "wrapped")}>View Wrapped</button>
          {error === "wrapped" && <p className={styles.errorMessage}>⚠️ You must connect to Spotify first.</p>}
        </div>

        <div className={styles.featureCard}>
          <h2>🔍 Search</h2>
          <p>Get music recommendations and search songs to add to your playlists.</p>
          <button onClick={() => handleProtectedNavigation("/search", "search")}>Try Search</button>
          {error === "search" && <p className={styles.errorMessage}>⚠️ You must connect to Spotify first.</p>}
        </div>

        <div className={styles.featureCard}>
          <h2>📝 Playlists</h2>
          <p>Edit your playlists or create new ones with your favorite songs.</p>
          <button onClick={() => handleProtectedNavigation("/playlists", "playlists")}>Manage Playlists</button>
          {error === "playlists" && <p className={styles.errorMessage}>⚠️ You must connect to Spotify first.</p>}
        </div>
      </section>
    </main>
  );
}
