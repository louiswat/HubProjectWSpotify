// src/utils/spotifyAuth.ts

// -------------- CONFIGURATION -----------------

const clientId = "f2ff29e6c8bf41969661c8171470ccb8"; // Replace with your real Client ID
const redirectUri = "http://127.0.0.1:3025/callback"; // Your registered redirect URI

const scopes = [
  "playlist-read-private",
  "playlist-modify-private",
  "playlist-modify-public",
  "user-read-recently-played",
  "user-top-read",
  "user-follow-read",
  "user-follow-modify",
  "user-read-playback-state",
  "user-modify-playback-state",
  "user-read-currently-playing",
  "streaming",
];

// -------------- PKCE HELPERS ------------------

// Generate random string for code verifier
export function generateCodeVerifier(length: number = 128): string {
  const possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
  let verifier = "";
  for (let i = 0; i < length; i++) {
    verifier += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return verifier;
}

// Generate SHA256 hash of code verifier
async function sha256(plain: string): Promise<ArrayBuffer> {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  return await crypto.subtle.digest("SHA-256", data);
}

// Base64-url encode helper
function base64UrlEncode(buffer: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

// Generate code challenge from code verifier
export async function generateCodeChallenge(
  codeVerifier: string
): Promise<string> {
  const hashed = await sha256(codeVerifier);
  return base64UrlEncode(hashed);
}

// -------------- AUTH URL GENERATOR -------------

export async function buildSpotifyAuthUrl(): Promise<{ url: string }> {
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);

  // Instead of localStorage, store verifier inside state
  const state = btoa(codeVerifier); // encode codeVerifier into state (simple base64 encoding)

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    scope: scopes.join(" "),
    redirect_uri: redirectUri,
    code_challenge_method: "S256",
    code_challenge: codeChallenge,
    state: state,
  });

  const url = `https://accounts.spotify.com/authorize?${params.toString()}`;

  return { url };
}

// -------------- TOKEN EXCHANGE -----------------

export async function exchangeCodeForToken(code: string, codeVerifier: string) {
  const body = new URLSearchParams({
    client_id: clientId,
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
    code_verifier: codeVerifier,
  });

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  if (!response.ok) {
    throw new Error("Failed to exchange code for tokens");
  }

  return await response.json();
}
