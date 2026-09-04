import jwtDecode, { JwtPayload } from "jwt-decode";
const JWTManager = () => {
  const LOGOUT_EVENT_NAME = "jwt-logout";

  let inMemoryToken: string | null = null;
  let refreshTokenTimeoutId: number | null = null;
  let user_id: number | null = null;

  const getToken = () => inMemoryToken;

  const getAccessToken = () => {
    if (inMemoryToken) return inMemoryToken;
    const accessToken = localStorage.getItem("accessToken");
    if (accessToken) {
      setToken(accessToken);
      return accessToken;
    }
    return null;
  };

  //const parseJWT = (accessToken: string) => JSON.parse(atob(accessToken.split(".")[1]));

  const isAuth = () => {
    const accessToken = localStorage.getItem("accessToken");
    if (accessToken) {
      //check if token is expired
      const { exp } = jwtDecode<JwtPayload>(accessToken);
      const currentTime = Date.now() / 1000;
      if (exp) {
        // console.log(
        //   "expired in",
        //   parseJWT(accessToken).exp - Math.floor(Date.now() / 1000)
        // );
        if (exp < currentTime) {
          // Expired: drop the token but keep display_name / role / user_id so a
          // silent refresh (AuthContext.checkAuth -> refreshAccessToken) can
          // resume the same session. deleteToken() used to wipe all of it,
          // which is why every launch after 12 h meant a fresh login.
          console.log("Token Expired");
          inMemoryToken = null;
          localStorage.removeItem("accessToken");
          return false;
        }
        setToken(accessToken);
        return true;
      }
    }
    return false;
  };

  const getUserId = () => user_id;

  const SetUserDetail = (display_name: string, role: string, user_id: string) => {
    localStorage.setItem("display_name", display_name);
    localStorage.setItem("role", role);
    localStorage.setItem("user_id", user_id)
  }

  const setToken = (accessToken: string) => {
    inMemoryToken = accessToken;
    localStorage.setItem("accessToken", accessToken);
    // Decode and set countdown to refresh
    const decoded = jwtDecode<JwtPayload & { user_id: number }>(accessToken);
    user_id = decoded.user_id;

    scheduleRefresh(decoded.exp);
    return true;
  };

  // Refresh five minutes before the access token expires, so a counter that
  // stays open all day never sees its requests start failing at the 12 h mark.
  // A failed attempt is retried every minute while the current token is still
  // valid; once it has expired the next launch goes through checkAuth instead.
  const scheduleRefresh = (exp?: number) => {
    abortRefreshToken();
    if (!exp) return;
    const msLeft = exp * 1000 - Date.now();
    if (msLeft <= 0) return;
    const delay = Math.max(msLeft - 5 * 60 * 1000, 60 * 1000);
    refreshTokenTimeoutId = window.setTimeout(async () => {
      const ok = await refreshAccessToken();
      if (!ok && exp * 1000 - Date.now() > 90 * 1000) {
        refreshTokenTimeoutId = window.setTimeout(() => scheduleRefresh(exp), 0);
      }
    }, delay);
  };

  const abortRefreshToken = () => {
    if (refreshTokenTimeoutId) window.clearTimeout(refreshTokenTimeoutId);
  };

  const deleteToken = () => {
    inMemoryToken = null;
    abortRefreshToken();
    // Delete from local storage
    localStorage.clear();
    window.localStorage.setItem(LOGOUT_EVENT_NAME, Date.now().toString());
    return true;
  };

  // To logout all tabs (nullify inMemoryToken)
  window.addEventListener("storage", (event) => {
    if (event.key === LOGOUT_EVENT_NAME) inMemoryToken = null;
  });

  // Mint a new access token from the httpOnly refresh cookie (30 days, renewed
  // on every use). Returns false and changes nothing when there is no usable
  // cookie: the caller decides whether that means "show the login page".
  const refreshAccessToken = async (): Promise<boolean> => {
    try {
      // Relative: proxied to the backend by vite.config.ts in dev and nginx.conf
      // in production, so this stays same-origin from any host (LAN IP included).
      const response = await fetch("/refresh_token", {
        credentials: "include",
      });
      if (!response.ok) return false;
      const data = (await response.json()) as {
        success: boolean;
        accessToken: string;
      };
      if (!data.success || !data.accessToken) return false;
      setToken(data.accessToken);
      return true;
    } catch (error) {
      console.log("Refresh token failed", error);
      return false;
    }
  };

  const getRefreshToken = async () => {
    console.log("Get Refresh Token");
    const ok = await refreshAccessToken();
    if (!ok) deleteToken();
    return ok;
  };

  // const setRefreshTokenTimeout = (delay: number) => {
  //   // 5s before token expires
  //   refreshTokenTimeoutId = window.setTimeout(
  //     getRefreshToken,
  //     delay * 1000 - 5000
  //   );
  // };

  return {
    SetUserDetail,
    getToken,
    getAccessToken,
    setToken,
    getRefreshToken,
    refreshAccessToken,
    deleteToken,
    getUserId,
    isAuth,
  };
};

export default JWTManager();
