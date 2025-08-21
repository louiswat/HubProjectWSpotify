export async function getUserPlaylists(token: string) {
  const res = await fetch("https://api.spotify.com/v1/me/playlists", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch playlists");
  const data = await res.json();
  return data.items;
}

export async function addTrackToPlaylist(
  playlistId: string,
  trackUri: string,
  token: string
) {
  const res = await fetch(
    `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ uris: [trackUri] }),
    }
  );
  if (!res.ok) throw new Error("Failed to add track");
  return await res.json();
}

export async function sendTokenToBackend(userId: string, token: string) {
  await fetch("http://localhost:3000/spotify/set-token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, token }),
  });
}

