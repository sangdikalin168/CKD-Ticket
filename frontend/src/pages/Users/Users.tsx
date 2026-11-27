import { gql, useMutation, useQuery } from "@apollo/client";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import {
  AlertCircle, KeyRound, Pencil, Plus, Search, ShieldCheck, UserCheck, UserX, Users as UsersIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Chip } from "@/components/ui/Chip";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/ui/PageHeader";
import { KNOWN_ROLES, normalizeRole, type Role } from "@/lib/access";

// ─── GraphQL ──────────────────────────────────────────────────────────────────

export const USERS = gql`
  query Users {
    users { user_id display_name username phone role is_active created_at }
  }
`;
const CREATE_USER = gql`
  mutation CreateUser($userInput: RegisterInput!) {
    create_user(userInput: $userInput) { success message }
  }
`;
const UPDATE_USER = gql`
  mutation UpdateUser($user_id: ID!, $input: UpdateUserInput!) {
    update_user(user_id: $user_id, input: $input) { success message }
  }
`;
const SET_ACTIVE = gql`
  mutation SetUserActive($user_id: ID!, $active: Boolean!) {
    set_user_active(user_id: $user_id, active: $active) { success message }
  }
`;
const RESET_PASSWORD = gql`
  mutation ResetUserPassword($user_id: ID!, $new_password: String!) {
    reset_user_password(user_id: $user_id, new_password: $new_password) { success message }
  }
`;

export interface UserRow {
  user_id: string;
  display_name: string;
  username: string;
  phone: string;
  role: string;
  is_active: number;
  created_at: string;
}

type MutationResult = { success: boolean; message?: string | null };

const MIN_PASSWORD = 6;

/** Kiosk service accounts are created by `npm run kiosk:create-user` on the
 *  server and are not edited here. */
const isStaff = (u: UserRow) => normalizeRole(u.role) !== null;

/** Shared by both pages: the role label in the user's language. */
export function useRoleLabel() {
  const { t } = useTranslation();
  return (role: string) => {
    const r = normalizeRole(role);
    return r ? t(`users.roles.${r}`) : role === "kiosk" ? t("users.roles.kiosk") : role;
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Users() {
  const { t } = useTranslation();
  const roleLabel = useRoleLabel();
  const myId = localStorage.getItem("user_id");
  const { data, loading, error, refetch } = useQuery<{ users: UserRow[] }>(USERS, { fetchPolicy: "network-only" });

  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<UserRow | "new" | null>(null);
  const [resetting, setResetting] = useState<UserRow | null>(null);
  const [toggling, setToggling] = useState<UserRow | null>(null);

  const users = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = data?.users ?? [];
    // Active staff first, then inactive, kiosk accounts last.
    const rank = (u: UserRow) => (!isStaff(u) ? 2 : u.is_active ? 0 : 1);
    return list
      .filter((u) => !q || [u.display_name, u.username, u.phone].some((v) => v?.toLowerCase().includes(q)))
      .sort((a, b) => rank(a) - rank(b) || a.display_name.localeCompare(b.display_name));
  }, [data, search]);

  if (loading && !data) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }
  if (error) {
    return (
      <p className="flex items-center gap-2 p-4 text-sm text-void-deep" role="alert">
        <AlertCircle className="h-4 w-4 shrink-0 text-void" aria-hidden="true" />
        {error.message}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader
        titleKey="users.title"
        subtitle={t("users.subtitle")}
        actions={
          <Button onClick={() => setEditing("new")}>
            <Plus aria-hidden="true" /> {t("users.addNew")}
          </Button>
        }
      />

      <div className="relative max-w-md">
        <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" aria-hidden="true" />
        <Input
          className="pl-8"
          placeholder={t("users.searchPlaceholder")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {users.length === 0 ? (
        <div className="rounded-lg border border-rule bg-card">
          <EmptyState icon={UsersIcon} title={t("users.emptyTitle")} description={t("users.emptyHint")} />
        </div>
      ) : (
        <div className="overflow-hidden overflow-x-auto rounded-lg border border-rule bg-card">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>{t("users.columnName")}</TableHead>
                <TableHead>{t("users.columnUsername")}</TableHead>
                <TableHead className="hidden md:table-cell">{t("users.columnPhone")}</TableHead>
                <TableHead>{t("users.columnRole")}</TableHead>
                <TableHead>{t("common.status")}</TableHead>
                <TableHead className="w-40"><span className="sr-only">{t("users.columnActions")}</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => {
                const staff = isStaff(u);
                const isMe = u.user_id === myId;
                return (
                  <TableRow key={u.user_id} className={u.is_active ? undefined : "text-ink-soft"}>
                    <TableCell className="font-medium text-ink">
                      {u.display_name}
                      {isMe && <span className="ml-2 text-caption text-ink-soft">({t("users.you")})</span>}
                    </TableCell>
                    <TableCell className="figure text-ink-soft">{u.username}</TableCell>
                    <TableCell className="figure hidden text-ink-soft md:table-cell">{u.phone}</TableCell>
                    <TableCell>
                      <Chip tone={staff ? "ink" : "muted"}>{roleLabel(u.role)}</Chip>
                    </TableCell>
                    <TableCell>
                      <Chip tone={u.is_active ? "paid" : "muted"}>
                        {u.is_active ? t("common.active") : t("common.inactive")}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      {staff ? (
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                            <Link
                              to={`/user_authorize?user=${u.user_id}`}
                              aria-label={t("users.permissions")}
                              title={t("users.permissions")}
                            >
                              <ShieldCheck aria-hidden="true" />
                            </Link>
                          </Button>
                          <Button
                            variant="ghost" size="icon" className="h-7 w-7"
                            onClick={() => setEditing(u)}
                            aria-label={t("common.edit")} title={t("common.edit")}
                          >
                            <Pencil aria-hidden="true" />
                          </Button>
                          <Button
                            variant="ghost" size="icon" className="h-7 w-7"
                            onClick={() => setResetting(u)}
                            aria-label={t("users.resetPassword")} title={t("users.resetPassword")}
                          >
                            <KeyRound aria-hidden="true" />
                          </Button>
                          <Button
                            variant="ghost" size="icon"
                            className="h-7 w-7 disabled:pointer-events-none disabled:opacity-30"
                            disabled={isMe && !!u.is_active}
                            onClick={() => setToggling(u)}
                            aria-label={u.is_active ? t("users.deactivate") : t("users.activate")}
                            title={isMe && u.is_active ? t("users.cannotDeactivateSelf") : u.is_active ? t("users.deactivate") : t("users.activate")}
                          >
                            {u.is_active ? <UserX aria-hidden="true" /> : <UserCheck aria-hidden="true" />}
                          </Button>
                        </div>
                      ) : (
                        <p className="text-right text-caption text-ink-soft">{t("users.kioskManaged")}</p>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {editing && (
        <UserDialog
          user={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); refetch(); }}
        />
      )}
      {resetting && <ResetPasswordDialog user={resetting} onClose={() => setResetting(null)} />}
      {toggling && (
        <ActiveDialog
          user={toggling}
          onClose={() => setToggling(null)}
          onSaved={() => { setToggling(null); refetch(); }}
        />
      )}
    </div>
  );
}

// ─── Create / edit ────────────────────────────────────────────────────────────

function UserDialog({ user, onClose, onSaved }: { user: UserRow | null; onClose: () => void; onSaved: () => void }) {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    display_name: user?.display_name ?? "",
    username: user?.username ?? "",
    phone: user?.phone ?? "",
    role: (normalizeRole(user?.role) ?? "Sale") as Role,
    password: "",
  });
  const [problem, setProblem] = useState("");
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));

  const [createUser, { loading: creating }] = useMutation<{ create_user: MutationResult }>(CREATE_USER);
  const [updateUser, { loading: updating }] = useMutation<{ update_user: MutationResult }>(UPDATE_USER);
  const busy = creating || updating;

  const save = async () => {
    setProblem("");
    if (!form.display_name.trim() || !form.username.trim() || !form.phone.trim()) {
      setProblem(t("users.fillAll"));
      return;
    }
    if (!user && form.password.length < MIN_PASSWORD) {
      setProblem(t("users.passwordTooShort", { n: MIN_PASSWORD }));
      return;
    }
    try {
      const profile = {
        display_name: form.display_name.trim(),
        username: form.username.trim(),
        phone: form.phone.trim(),
        role: form.role,
      };
      const res = user
        ? (await updateUser({ variables: { user_id: user.user_id, input: profile } })).data?.update_user
        : (await createUser({ variables: { userInput: { ...profile, password: form.password } } })).data?.create_user;
      if (!res?.success) {
        setProblem(res?.message || t("users.saveFailed"));
        return;
      }
      toast.success(user ? t("users.updated") : t("users.created"));
      onSaved();
    } catch (e) {
      setProblem(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{user ? t("users.editTitle") : t("users.createTitle")}</DialogTitle>
        </DialogHeader>
        <form
          className="space-y-4 py-1"
          onSubmit={(e) => { e.preventDefault(); save(); }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="u-name">{t("users.fieldName")}</Label>
            <Input id="u-name" value={form.display_name} onChange={(e) => set("display_name", e.target.value)} autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="u-username">{t("users.fieldUsername")}</Label>
              <Input id="u-username" autoComplete="off" value={form.username} onChange={(e) => set("username", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="u-phone">{t("users.fieldPhone")}</Label>
              <Input id="u-phone" inputMode="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="u-role">{t("users.fieldRole")}</Label>
            <Select value={form.role} onValueChange={(v) => set("role", v as Role)}>
              <SelectTrigger id="u-role"><SelectValue /></SelectTrigger>
              <SelectContent>
                {KNOWN_ROLES.map((r) => (
                  <SelectItem key={r} value={r}>{t(`users.roles.${r}`)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-caption text-ink-soft">{t(`users.roleHint.${form.role}`)}</p>
          </div>
          {!user && (
            <div className="space-y-1.5">
              <Label htmlFor="u-password">{t("users.fieldPassword")}</Label>
              <Input
                id="u-password" type="password" autoComplete="new-password"
                value={form.password} onChange={(e) => set("password", e.target.value)}
              />
              <p className="text-caption text-ink-soft">{t("users.passwordHint", { n: MIN_PASSWORD })}</p>
            </div>
          )}
          {problem && <p className="text-sm text-void-deep" role="alert">{problem}</p>}
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={busy}>{t("common.cancel")}</Button>
            <Button type="submit" disabled={busy}>
              {busy ? t("common.saving") : user ? t("common.save") : t("common.create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Reset password ───────────────────────────────────────────────────────────

function ResetPasswordDialog({ user, onClose }: { user: UserRow; onClose: () => void }) {
  const { t } = useTranslation();
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [problem, setProblem] = useState("");
  const [reset, { loading }] = useMutation<{ reset_user_password: MutationResult }>(RESET_PASSWORD);

  const save = async () => {
    setProblem("");
    if (pw.length < MIN_PASSWORD) return setProblem(t("users.passwordTooShort", { n: MIN_PASSWORD }));
    if (pw !== confirm) return setProblem(t("users.passwordMismatch"));
    try {
      const res = (await reset({ variables: { user_id: user.user_id, new_password: pw } })).data?.reset_user_password;
      if (!res?.success) return setProblem(res?.message || t("users.saveFailed"));
      toast.success(t("users.passwordReset"));
      onClose();
    } catch (e) {
      setProblem(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{t("users.resetTitle", { name: user.display_name })}</DialogTitle>
        </DialogHeader>
        <form className="space-y-4 py-1" onSubmit={(e) => { e.preventDefault(); save(); }}>
          <p className="text-sm text-ink-soft">{t("users.resetHint")}</p>
          <div className="space-y-1.5">
            <Label htmlFor="rp-new">{t("users.fieldNewPassword")}</Label>
            <Input id="rp-new" type="password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} autoFocus />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="rp-confirm">{t("users.fieldConfirmPassword")}</Label>
            <Input id="rp-confirm" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          </div>
          {problem && <p className="text-sm text-void-deep" role="alert">{problem}</p>}
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>{t("common.cancel")}</Button>
            <Button type="submit" disabled={loading}>{loading ? t("common.saving") : t("users.resetPassword")}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Activate / deactivate ────────────────────────────────────────────────────

function ActiveDialog({ user, onClose, onSaved }: { user: UserRow; onClose: () => void; onSaved: () => void }) {
  const { t } = useTranslation();
  const deactivating = !!user.is_active;
  const [problem, setProblem] = useState("");
  const [setActive, { loading }] = useMutation<{ set_user_active: MutationResult }>(SET_ACTIVE);

  const save = async () => {
    setProblem("");
    try {
      const res = (await setActive({ variables: { user_id: user.user_id, active: !deactivating } })).data?.set_user_active;
      if (!res?.success) return setProblem(res?.message || t("users.saveFailed"));
      toast.success(deactivating ? t("users.deactivated") : t("users.activated"));
      onSaved();
    } catch (e) {
      setProblem(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {deactivating
              ? t("users.deactivateTitle", { name: user.display_name })
              : t("users.activateTitle", { name: user.display_name })}
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-ink-soft">{deactivating ? t("users.deactivateHint") : t("users.activateHint")}</p>
        {problem && <p className="text-sm text-void-deep" role="alert">{problem}</p>}
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={loading}>{t("common.cancel")}</Button>
          <Button variant={deactivating ? "destructive" : "default"} onClick={save} disabled={loading}>
            {deactivating ? t("users.deactivate") : t("users.activate")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
