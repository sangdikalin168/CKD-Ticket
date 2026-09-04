import {
  useState,
  Dispatch,
  SetStateAction,
  createContext,
  ReactNode,
  useContext,
  useCallback,
} from "react";
import JWTManager from "../utils/jwt"

interface IAuthContext {
  isLoading: boolean;
  setIsLoading: Dispatch<SetStateAction<boolean>>;
  isAuthenticated: boolean;
  setIsAuthenticated: Dispatch<SetStateAction<boolean>>;
  checkAuth: () => Promise<void>;
  logoutClient: () => void;
}

const defaultIsAuthenticated = false;
const defaultisLoading = true;

export const AuthContext = createContext<IAuthContext>({
  isAuthenticated: defaultIsAuthenticated,
  isLoading: defaultisLoading,
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  setIsAuthenticated: () => { },
  setIsLoading: () => { },
  checkAuth: () => Promise.resolve(),
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  logoutClient: () => { },
});

export const useAuthContext = () => useContext(AuthContext);

const AuthContextProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(
    defaultIsAuthenticated
  );

  const [isLoading, setIsLoading] = useState(defaultisLoading);

  const checkAuth = useCallback(async () => {
    if (JWTManager.isAuth()) {
      setIsAuthenticated(true);
      return;
    }
    // No valid access token: first launch of the day, or the 12 h token has
    // expired. The refresh cookie set at login can mint a new one, so the
    // counter does not log in again after every restart. Log Out invalidates
    // that cookie server-side, so this never revives a session the user ended.
    if (await JWTManager.refreshAccessToken()) setIsAuthenticated(true);
  }, []);

  const logoutClient = () => {
    localStorage.removeItem("accessToken");
    JWTManager.deleteToken();
    setIsAuthenticated(false);
  };

  const authContextData = {
    isAuthenticated,
    setIsAuthenticated,
    isLoading,
    setIsLoading,
    checkAuth,
    logoutClient,
  };

  return (
    <AuthContext.Provider value={authContextData}>
      {children}{" "}
    </AuthContext.Provider>
  );
};

export default AuthContextProvider;
