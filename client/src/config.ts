// Centralized backend endpoint resolution.
//
// Decided at RUNTIME from the current location rather than baked in at build time.
// This is deliberate: the bundle that ships to production must keep working even if
// it was accidentally built/served in development mode (e.g. via the Vite dev
// server). Build-mode env vars (.env.development vs .env.production) are NOT trusted
// to pick the URL, because a dev-mode artifact would otherwise hardcode
// "http://localhost:4000" and break once it is opened from the public domain.
//
// The rule is simply "who is serving this page?":
//
//   Vite dev server (:5173 / :5174)   -> http://<same-host>:4000/graphql
//                                        `yarn start` (start_system.bat) serves the
//                                        SPA from Vite while the API stays on :4000,
//                                        so a relative path would hit Vite and get
//                                        index.html back. Follows the host the user
//                                        typed, so LAN access (e.g. 192.168.1.20)
//                                        reaches that machine's API, not localhost.
//   Any other web origin              -> "/graphql"  (same-origin, relative)
//                                        The SPA is served by Node itself, directly
//                                        or through the Cloudflare Tunnel, so a
//                                        relative path avoids mixed-content blocks.
//   Non-web (Electron file://, etc.)  -> VITE_API_URL (if absolute) or localhost.
const { protocol, hostname, port } = window.location;

const isWeb = protocol === "http:" || protocol === "https:";

// Ports Vite listens on (see client/package.json "dev"/"start"). When the page comes
// from one of these, the API lives on a different port and must be addressed absolutely.
const VITE_PORTS = ["5173", "5174"];
const servedByVite = isWeb && VITE_PORTS.includes(port);

// VITE_API_URL is only usable as a fallback when it is absolute; .env.production sets
// it to the relative "/graphql", which is meaningless outside an http(s) origin.
const envApiUrl = import.meta.env.VITE_API_URL;
const absoluteEnvApiUrl = /^https?:\/\//.test(envApiUrl ?? "") ? envApiUrl : "";

export const API_URL = !isWeb
  ? absoluteEnvApiUrl || "http://localhost:4000/graphql"
  : servedByVite
    ? `${protocol}//${hostname}:4000/graphql`
    : "/graphql";

// Origin/base used for non-GraphQL endpoints (refresh token, uploaded files).
// Derived from API_URL by stripping the trailing "/graphql".
//   "/graphql"                          -> ""                       (relative)
//   "http://192.168.1.20:4000/graphql"  -> "http://192.168.1.20:4000"
export const API_BASE = API_URL.replace(/\/graphql\/?$/, "");
