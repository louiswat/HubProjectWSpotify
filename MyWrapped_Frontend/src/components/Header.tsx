"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link";
import styles from './scss/Header.module.scss';
import { usePathname } from "next/navigation";
import { useDarkMode } from "@/utils/useDarkMode";
import useHasMounted from "@/utils/useHasMounted";

export default function Header() {
    const hasMounted = useHasMounted();

    const [token, setToken] = useState<string | null>(null);
    const [profile, setProfile] = useState<any>(null);
    const pathname = usePathname();
    const { isDark, toggleDarkMode } = useDarkMode();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const toggleMenu = () => {
        setIsMenuOpen(prev => !prev);
    };

    useEffect(() => {
        const accessToken = localStorage.getItem("spotify_access_token");
        setToken(accessToken);

        if (!accessToken) {
            return;
        }

        fetch("https://api.spotify.com/v1/me", {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        })
            .then((res) => {
                if (!res.ok) throw new Error("Failed to fetch profile");
                return res.json();
            })
            .then((data) => setProfile(data))
            .catch((err) => {
                console.error(err);
                setProfile(null);
            })
    }, []);


    const handleLogout = () => {
        localStorage.removeItem("spotify_access_token");
        localStorage.removeItem("spotify_refresh_token");
        window.location.href = "/";
    };

    if (!hasMounted) {
        return null;
    }

    return (
        <header className={styles.header}>
            <div className={styles.logoSection}>
                {token && (
                    <button onClick={toggleMenu} className={styles.menuButton}>
                        ☰
                    </button>
                )}
                <h3>🎵 My Wrapped+</h3>
            </div>

            <nav className={styles.navLinks}>
                {token && profile && (
                    <>
                        <Link className={`${styles.link} ${pathname === "/wrapped" ? styles.active : ""}`} href={"/wrapped"}>📊Wrapped</Link>
                        <Link className={`${styles.link} ${pathname === "/search" ? styles.active : ""}`} href={"/search"}>🔍Search</Link>
                        <Link className={`${styles.link} ${pathname === "/playlists" ? styles.active : ""}`} href={"/playlists"}>📚Playlists</Link>
                    </>
                )}
            </nav>

            <div className={styles.authSection}>
                {token && profile && (
                    <>
                        <span>Logged in as {profile.display_name}</span>
                        <button onClick={handleLogout} className={styles.button}>
                            Logout
                        </button>
                        <button onClick={toggleDarkMode} className={styles.darkModeButton}>
                            {isDark ? "☀️" : "🌙"}
                        </button>
                    </>
                )}
            </div>

            {isMenuOpen && (
                <div className={styles.sidePanel}>
                    <button onClick={toggleMenu} className={styles.closeButton}>✕</button>
                    <Link className={`${styles.link} ${pathname === "/wrapped" ? styles.active : ""}`} href={"/wrapped"} onClick={toggleMenu}>📊Wrapped</Link>
                    <Link className={`${styles.link} ${pathname === "/search" ? styles.active : ""}`} href={"/search"} onClick={toggleMenu}>🔍Search</Link>
                    <Link className={`${styles.link} ${pathname === "/playlists" ? styles.active : ""}`} href={"/playlists"} onClick={toggleMenu}>📚Playlists</Link>
                </div>
            )}
        </header>
    );
}
