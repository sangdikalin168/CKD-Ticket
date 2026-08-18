import React, { FormEvent, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ExclamationCircleIcon as AlertCircle,
  EyeIcon as Eye,
  EyeSlashIcon as EyeOff,
  ArrowPathIcon as Loader2,
} from "@heroicons/react/24/outline";
import JWTManager from "../../utils/jwt";
import { useAuthContext } from "../../context/AuthContext";
import { useLoginMutation } from "../../generated/graphql";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";

const AMBER = "#D97B2A";
const AMBER_GLOW = "rgba(217, 123, 42, 0.2)";
// The mark is a transparent PNG whose temple glyph is dark slate, so it sits on a light
// plate rather than directly on `bg-background` (near-black under the .dark theme).
const LOGO_PLATE = "#F8F5EF";

function Login() {
  const { t } = useTranslation();
  const { setIsAuthenticated } = useAuthContext();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);

  const usernameRef = useRef<HTMLInputElement>(null);

  useEffect(() => { usernameRef.current?.focus(); }, []);

  const [login] = useLoginMutation({
    // With an onError handler Apollo resolves instead of rejecting, so network
    // failures land here rather than at the await below.
    onError: (err) => {
      setIsSubmitting(false);
      setError(err.message);
    },
  });

  const handleCapsLock = (e: React.KeyboardEvent<HTMLInputElement>) => {
    setCapsLockOn(e.getModifierState("CapsLock"));
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;
    setError("");

    if (!username.trim()) {
      setError(t("login.usernameRequired"));
      return;
    }
    if (!password) {
      setError(t("login.passwordRequired"));
      return;
    }

    setIsSubmitting(true);
    const { data } = await login({
      variables: { loginInput: { username, password } },
    });

    // onError already reported the failure and cleared the spinner.
    if (!data) return;

    if (data.login.success) {
      const res = data.login.user;
      // `user` is nullable in the schema; storing `undefined` here used to write
      // the literal string "undefined" into localStorage.
      if (res) JWTManager.SetUserDetail(res.display_name, res.role, res.user_id);
      JWTManager.setToken(data.login.accessToken as string);
      // Leave isSubmitting on — the authenticated shell replaces this page.
      setIsAuthenticated(true);
      return;
    }

    setError(data.login.message || t("login.wrongCredentials"));
    setIsSubmitting(false);
  };

  return (
    <>
      <style>{`
        @keyframes nan-slide-up {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .nan-s1 { animation: nan-slide-up 0.55s cubic-bezier(0.16,1,0.3,1) 0.05s both; }
        .nan-s2 { animation: nan-slide-up 0.55s cubic-bezier(0.16,1,0.3,1) 0.12s both; }
        .nan-s3 { animation: nan-slide-up 0.55s cubic-bezier(0.16,1,0.3,1) 0.19s both; }
        .nan-s4 { animation: nan-slide-up 0.55s cubic-bezier(0.16,1,0.3,1) 0.26s both; }
        .nan-s5 { animation: nan-slide-up 0.55s cubic-bezier(0.16,1,0.3,1) 0.33s both; }

        .nan-input:focus {
          outline: none !important;
          border-color: ${AMBER} !important;
          box-shadow: 0 0 0 3px ${AMBER_GLOW} !important;
        }

        .nan-submit {
          background: ${AMBER};
          box-shadow: 0 2px 16px ${AMBER_GLOW};
          transition: background 0.15s ease, box-shadow 0.15s ease, transform 0.1s ease;
        }
        .nan-submit:not(:disabled):hover {
          background: #c46d22;
          box-shadow: 0 4px 24px rgba(217,123,42,0.38);
          transform: translateY(-1px);
        }
        .nan-submit:not(:disabled):active {
          transform: translateY(0);
        }
        .nan-eye:hover { color: ${AMBER}; }
      `}</style>

      <div className="fixed inset-0 flex items-center justify-center overflow-y-auto bg-background px-5 py-10">
        <div className="w-full max-w-[360px]">

          {/* Logo */}
          <div className="nan-s1 mb-9 flex flex-col items-center gap-3.5">
            <div
              className="flex flex-shrink-0 items-center justify-center"
              style={{
                width: 84, height: 72, borderRadius: 16,
                background: LOGO_PLATE,
                border: "1px solid rgba(15,23,42,0.07)",
                boxShadow: `0 4px 20px ${AMBER_GLOW}`,
              }}
            >
              <img
                src="/nan-tech-logo.png"
                alt={t("login.brand")}
                style={{ height: 42, width: "auto" }}
              />
            </div>
            <div className="text-center">
              <p className="text-[12px] leading-[1.4] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                {t("login.brand")}
              </p>
              <p className="text-sm font-semibold text-foreground" style={{ letterSpacing: "-0.01em" }}>
                {t("login.system")}
              </p>
            </div>
          </div>

          {/* Heading */}
          <div className="nan-s2">
            <h1
              className="text-foreground"
              style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.2 }}
            >
              {t("login.signIn")}
            </h1>
            <p className="mt-1.5 text-muted-foreground" style={{ fontSize: 13.5 }}>
              {t("login.subtitle")}
            </p>
          </div>

          {/* Error */}
          {error && (
            <div
              role="alert"
              aria-live="assertive"
              className="nan-s2 mt-5 flex items-start gap-2.5 rounded-lg px-3.5 py-3"
              style={{
                border: "1px solid rgba(239,68,68,0.2)",
                background: "rgba(239,68,68,0.06)",
              }}
            >
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-destructive" aria-hidden="true" />
              <p className="text-sm font-medium text-destructive">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={onSubmit} noValidate autoComplete="off" className="mt-7 space-y-4">
            <div className="nan-s3 space-y-1.5">
              <Label
                htmlFor="username"
                className="text-muted-foreground"
                style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase" }}
              >
                {t("login.username")}
              </Label>
              <Input
                id="username"
                name="username"
                type="text"
                ref={usernameRef}
                placeholder={t("login.usernamePlaceholder")}
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="nan-input h-11 w-full"
                autoComplete="off"
                aria-invalid={!!error}
                disabled={isSubmitting}
              />
            </div>

            <div className="nan-s4 space-y-1.5">
              <Label
                htmlFor="password"
                className="text-muted-foreground"
                style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase" }}
              >
                {t("login.password")}
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder={t("login.passwordPlaceholder")}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyUp={handleCapsLock}
                  onKeyDown={handleCapsLock}
                  className="nan-input h-11 w-full pr-11"
                  autoComplete="off"
                  aria-invalid={!!error}
                  aria-describedby={capsLockOn ? "caps-lock-hint" : undefined}
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="nan-eye absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1.5 text-muted-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label={showPassword ? t("login.hidePassword") : t("login.showPassword")}
                  aria-pressed={showPassword}
                  tabIndex={-1}
                >
                  {showPassword
                    ? <EyeOff className="h-4 w-4" aria-hidden="true" />
                    : <Eye className="h-4 w-4" aria-hidden="true" />}
                </button>
              </div>
              {capsLockOn && (
                <p id="caps-lock-hint" className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400" style={{ fontSize: 11.5 }}>
                  <AlertCircle className="h-3 w-3" aria-hidden="true" />
                  {t("login.capsLockOn")}
                </p>
              )}
            </div>

            <div className="nan-s5 pt-1">
              <button
                type="submit"
                disabled={isSubmitting}
                className="nan-submit flex h-11 w-full items-center justify-center gap-2 rounded-lg font-semibold text-white disabled:cursor-not-allowed disabled:opacity-55"
                style={{ fontSize: 14, letterSpacing: "0.01em" }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    {t("login.signingIn")}
                  </>
                ) : (
                  t("login.signIn")
                )}
              </button>
            </div>
          </form>

          {/* Footer — language picker sits with the copyright, since the app Header
              is not rendered before login. */}
          <div className="nan-s5 mt-10 flex flex-col items-center gap-2">
            <LanguageSwitcher align="center" side="top" />
            <p className="text-center text-muted-foreground" style={{ fontSize: 11.5, letterSpacing: "0.02em" }}>
              {t("login.copyright", { year: new Date().getFullYear() })}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

export default Login;
