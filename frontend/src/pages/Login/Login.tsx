import React, { FormEvent, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react";
import JWTManager from "../../utils/jwt";
import { useAuthContext } from "../../context/AuthContext";
import { useLoginMutation } from "../../generated/graphql";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { StateDot } from "@/components/ui/Chip";

// The mark is a transparent PNG whose temple glyph is dark slate, so it sits on
// its own pale plate rather than directly on the card.
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
    <div className="fixed inset-0 flex items-center justify-center overflow-y-auto bg-floor px-5 py-10">
      <div className="w-full max-w-[380px]">

        {/* The family mark on its plate, above the system's name */}
        <div className="mb-6 flex flex-col items-center gap-3">
          <div
            className="flex flex-shrink-0 items-center justify-center rounded-lg border border-rule"
            style={{ width: 84, height: 72, background: LOGO_PLATE }}
          >
            <img
              src="/nan-tech-logo.png"
              alt={t("login.brand")}
              style={{ height: 42, width: "auto" }}
            />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-ink">{t("login.brand")}</p>
            <p className="text-caption text-ink-soft">{t("login.system")}</p>
          </div>
        </div>

        {/* The form on one white card, the way every other surface reads */}
        <div className="rounded-lg border border-rule bg-card p-6">
        <div>
          <h1 className="text-xl font-semibold leading-tight text-ink">{t("login.signIn")}</h1>
          <p className="mt-1 text-sm text-ink-soft">{t("login.subtitle")}</p>
        </div>

        {/* Error */}
        {error && (
          <div
            role="alert"
            aria-live="assertive"
            className="mt-4 flex items-start gap-2.5 rounded-md border border-void/40 bg-void-tint px-3.5 py-3"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-void" aria-hidden="true" />
            <p className="text-sm text-ink">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={onSubmit} noValidate autoComplete="off" className="mt-5 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="username">{t("login.username")}</Label>
            <Input
              id="username"
              name="username"
              type="text"
              ref={usernameRef}
              placeholder={t("login.usernamePlaceholder")}
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="h-11 w-full"
              autoComplete="off"
              aria-invalid={!!error}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">{t("login.password")}</Label>
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
                className="h-11 w-full pr-11"
                autoComplete="off"
                aria-invalid={!!error}
                aria-describedby={capsLockOn ? "caps-lock-hint" : undefined}
                disabled={isSubmitting}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1.5 text-ink-soft transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
              <p id="caps-lock-hint" className="flex items-center gap-1.5 text-caption text-ink">
                <StateDot tone="pending" size={8} />
                {t("login.capsLockOn")}
              </p>
            )}
          </div>

          <div className="pt-1">
            <Button
              type="submit"
              variant="commit"
              size="lg"
              disabled={isSubmitting}
              className="w-full"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" aria-hidden="true" />
                  {t("login.signingIn")}
                </>
              ) : (
                t("login.signIn")
              )}
            </Button>
          </div>
        </form>

        </div>

        {/* Footer — language picker sits with the copyright, since the app Header
            is not rendered before login. */}
        <div className="mt-6 flex flex-col items-center gap-2">
          <LanguageSwitcher align="center" side="top" />
          <p className="text-center text-caption text-ink-soft">
            {t("login.copyright", { year: new Date().getFullYear() })}
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
