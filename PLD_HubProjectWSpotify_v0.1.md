# PLD — HubProjectWSpotify

**Version:** 0.1  
**Date:** 2025‑08‑22  
**Owner:** louiswat  

---

## 1) Overview
**Goal.** A lightweight “Spotify Wrapped” style web app with:
- Secure Spotify login (OAuth).
- A **Wrapped** view with Top Tracks/Artists over **short_term / medium_term / long_term**, switchable by buttons, sorted (by popularity by default).
- A **Search** page to find tracks.
- Ability to **add a track to one of the user’s playlists directly from search results** via a dropdown/popup that lists the user’s playlists.
- A **Playlists** page (UI planned; feature work tracked as an Epic in backlog).
- A backend that centralizes Spotify API calls (NestJS), including token exchange/refresh and endpoints used by the frontend (Next.js/TypeScript).

**Primary Actors.**
- **Visitor** (not authenticated yet).  
- **Authenticated User** (Spotify account).  
- **Spotify Web API** (3rd party service).

---

## 2) Assumptions & Constraints
- Frontend framework: **Next.js + TypeScript** (SPA-like pages: Home, Search, Wrapped, Playlists).  
- Backend framework: **NestJS + TypeScript**, exposes REST endpoints that proxy Spotify and manage OAuth tokens.  
- Spotify scopes likely required: `user-read-email`, `user-top-read`, `playlist-read-private`, `playlist-modify-private` (and/or `playlist-modify-public`), possibly `playlist-read-collaborative`.
- Tokens handled server‑side; frontend never persists client secret; refresh supported server‑side.  
- Environment variables: `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, `SPOTIFY_REDIRECT_URI`, `APP_BASE_URL`, etc.  
- UI/UX: simple, clean, a dedicated **“Add to Playlist”** button aligned to the right of each track card in Search.

---

## 3) Epics & User Stories (Delivered scope — current)

### Epic A — Authentication & Session
**US‑A1. Login with Spotify (OAuth).**  
As a visitor, I can sign in with Spotify so the app can access my data.  
**Acceptance:**
- Clicking **Login** sends me to Spotify’s consent page with the listed scopes.  
- On **callback**, the backend exchanges code → tokens and stores/associates them to my session/profile.  
- Subsequent API calls succeed without re‑prompting until token expiry; refresh occurs transparently.
**Estimate:** **1.5 J/H**  
**Status:** Implemented.

**US‑A2. Logout.**  
As a user, I can sign out to clear my session.  
**Acceptance:**
- Logout clears app session; visiting protected views triggers login.  
**Estimate:** **0.25 J/H**  
**Status:** Implemented.

### Epic B — Wrapped (Top items)
**US‑B1. View Top Tracks/Artists with period filters.**  
As a user, I can switch between **Musics/Artists** and choose **short_term / medium_term / long_term** to see my top items, **sorted by popularity** by default.  
**Acceptance:**
- Toggle buttons: **Musics** ↔ **Artists**.  
- Period chips: **short** / **medium** / **long**.  
- Results list shows at least: cover/artwork, title/name, rank/position, popularity/score.  
- Loading/empty/error states are visible and clear.  
**Estimate:** **1.5 J/H**  
**Status:** Implemented.

### Epic C — Search & Add to Playlist
**US‑C1. Search tracks.**  
As a user, I can search for tracks and see results.  
**Acceptance:**
- Input debounced; results paginated or load‑more.  
- Track cards show: artwork, title, artists, album, duration (if available).  
- Loading/empty/error states present.  
**Estimate:** **1.0 J/H**  
**Status:** Implemented.

**US‑C2. Add a track to one of my playlists from Search.**  
As a user, I can click **Add to Playlist** on a result and pick a playlist from my list; success adds the track to that playlist.  
**Acceptance:**
- **Button** is visually aligned to the **right** of each track card.  
- On click, a **dropdown/popup** lists my playlists (name + visibility).  
- Choosing a playlist triggers a backend call; on success, UI gives a clear confirmation; on failure, a visible error.  
- Works for private playlists (requires correct scopes).  
**Estimate:** **1.5 J/H**  
**Status:** Implemented.

### Epic D — Backend Integration (NestJS)
**US‑D1. Centralize Spotify token/profile logic.**  
As a developer, I have a **`POST /spotify/profile`** (or equivalent) to associate the current token with the user session and keep Spotify logic on the server.  
**Acceptance:**
- Frontend no longer passes explicit `userId`; server resolves the user from the token/session.  
- Refresh token logic implemented; access token rotated automatically.  
**Estimate:** **1.0 J/H**  
**Status:** Implemented.

**US‑D2. API endpoints for frontend features.**  
As a developer, the backend exposes endpoints for: **top tracks/artists**, **search**, **profile**, and **set-token**. *(Playlist list/add are currently handled directly by the frontend calling the Spotify Web API with the bearer token.)*  
**Acceptance:**
- `GET /spotify/top` returns top tracks/artists for a time range.  
- `GET /spotify/search` returns tracks/artists by query.  
- `POST /spotify/profile` accepts `{ token }` and returns the Spotify user profile; stores association server-side.  
- `POST /spotify/set-token` accepts `{ userId, token }` for simple in‑memory association.  
- Minimal unit tests for controller/service methods.
**Estimate:** **1.5 J/H**  
**Status:** Implemented.

### Epic E — UI & Quality
**US‑E1. Homepage & Nav.**  
As a user, I see a basic homepage with entry points to **Wrapped**, **Search**, and **Playlists**.  
**Acceptance:**
- Navigation links; basic layout; auth‑aware header.  
**Estimate:** **0.5 J/H**  
**Status:** Implemented.

**US‑E2. Error & loading states; token‑expiry handling.**  
As a user, I get clear loaders and errors across views; expired tokens lead me back to login (or auto‑refresh).  
**Acceptance:**
- Spinners/skeletons; toast/inline errors; graceful retries where sensible.  
**Estimate:** **1.0 J/H**  
**Status:** Implemented.

**US‑E3. Backend unit tests (smoke).**  
As a developer, core Spotify service methods have Jest tests (happy path + a couple error cases).  
**Estimate:** **0.75 J/H**  
**Status:** Implemented.

**US‑E4. Project docs & environment.**  
As a developer, I have a README with env setup and run scripts for frontend/backend.  
**Estimate:** **0.5 J/H**  
**Status:** Implemented.

> **Delivered subtotal (current):** 1.5 + 0.25 + 1.5 + 1.0 + 1.5 + 1.0 + 1.5 + 0.5 + 1.0 + 0.75 + 0.5 = **11.0 J/H**.

---

## 4) Backlog (to reach/extend final 12 J/H)

### Epic F — Playlists page (browse & details)
**US‑F1. Browse my playlists.**  
As a user, I can open **Playlists** and see my playlists with cover, name, public/private, and track count.  
**Acceptance (future):**
- List view with pagination or lazy load.  
- Clicking a playlist opens a detail view with its tracks.  
- From detail, I can at least **view** tracks (remove/add optional).  
**Estimate:** **1.25 J/H** (1.0 J/H if list‑only MVP).  
**Status:** **Backlog** (UI currently empty).

**US‑P2. Nice‑to‑have polish.**  Animations, richer cards, better empty states, playlists search/filter, etc.  
**Estimate:** **0.5–1.0 J/H**.  
**Status:** Backlog.

---

## 5) Non‑Functional Requirements (NFR)
- **Security:** OAuth code‑flow; secrets server‑side only; no tokens in client storage beyond session; CSRF on auth routes; rate‑limit backend endpoints.  
- **Performance:** Spotify calls batched where possible; minimal over‑fetch; debounce search; cache short‑lived results server‑side if needed.  
- **Reliability:** Clear retries on transient 5xx; timeouts on Spotify calls.  
- **Observability:** Console/server logs around Spotify calls; surface request IDs in errors.  
- **UX:** Accessible components (buttons/menus focusable; aria labels for “Add to Playlist”).

---

## 6) Definition of Done (DoD)
- Story acceptance criteria met; code merged; basic unit tests passing; no `any` in new TS tests; lint/format clean.  
- .env.example updated; README updated with scopes and run instructions.  
- Manual QA: login, Wrapped filters, search, add‑to‑playlist across at least two playlists, logout.

---

## 7) Evidence & Traceability (to be linked during review)
> After a code review pass, link files/endpoints here for traceability.

| Story | Frontend evidence | Backend evidence |
|---|---|---|
| US‑A1 | `MyWrapped_Frontend/src/utils/spotifyAuth.ts` (PKCE auth), `MyWrapped_Frontend/src/app/callback/page.tsx` (store tokens) | — |
| US‑A2 | `MyWrapped_Frontend/src/app/page.tsx` (Logout button/logic) | — |
| US‑B1 | `MyWrapped_Frontend/src/app/wrapped/page.tsx` (calls `/spotify/top`) | `my-wrapped_backend/src/spotify/spotify.controller.ts` → `GET /spotify/top`; `my-wrapped_backend/src/spotify/spotify.service.ts#getTopTracksOrArtistsFromToken` |
| US‑C1 | `MyWrapped_Frontend/src/app/search/page.tsx` | `my-wrapped_backend/src/spotify/spotify.controller.ts` → `GET /spotify/search`; `my-wrapped_backend/src/spotify/spotify.service.ts#searchWithToken` |
| US‑C2 | `MyWrapped_Frontend/src/components/PlaylistSelector.tsx`, `MyWrapped_Frontend/src/utils/spotify.ts` (direct calls to Spotify API) | *(No backend endpoint; handled client-side)* |
| US‑D1 | `MyWrapped_Frontend/src/app/page.tsx` uses `sendTokenToBackend` | `my-wrapped_backend/src/spotify/spotify.controller.ts` → `POST /spotify/profile`, `POST /spotify/set-token`; `my-wrapped_backend/src/spotify/spotify.service.ts#setUserToken`, `#getProfileFromToken` |
| US‑D2 | `Wrapped`/`Search` pages consume backend endpoints | `GET /spotify/top`, `GET /spotify/search`, `POST /spotify/profile`, `POST /spotify/set-token` |
| US‑E1 | `MyWrapped_Frontend/src/app/page.tsx` (Home & Nav) | — |
| US‑E2 | Loaders/errors in `wrapped/page.tsx`, `search/page.tsx` | Error handling & `UnauthorizedException` in `spotify.controller.ts` |
| US‑E3 | — | `my-wrapped_backend/src/spotify/spotify.controller.spec.ts`, `my-wrapped_backend/src/spotify/spotify.service.spec.ts` |
| US‑E4 | `MyWrapped_Frontend/README.md` | `my-wrapped_backend/README.md` |


---

## 8) Risks & Mitigations
- **Token/refresh drift** → Add refresh guards + clear error paths to login.  
- **Scope mismatch** (e.g., cannot add to private playlists) → Document required scopes; check on login.  
- **Rate limits** → Debounce/throttle search; backoff on 429.

---


## 10) Setup (quick reference)
- Frontend: Next.js (TypeScript).  
- Backend: NestJS (TypeScript).  
- Env: `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, `SPOTIFY_REDIRECT_URI`, `NEXT_PUBLIC_API_BASE`, etc.  
- Run: `npm i && npm run dev` (per app).  
- Login via Spotify; test flows: Wrapped → Search → Add to Playlist → Logout.

---

**End of PLD v0.1**
