import { gql, useApolloClient, useMutation, useQuery } from "@apollo/client";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { AlertCircle, RotateCcw, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Chip } from "@/components/ui/Chip";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/ui/PageHeader";
import { cn } from "@/lib/utils";
import { PERMISSIONS, PERMISSION_GROUPS, normalizeRole, setPermissions, type Permission } from "@/lib/access";
import { USERS, useRoleLabel, type UserRow } from "./Users";

const USER_PERMISSIONS = gql`
  query UserPermissions($user_id: ID!) {
    user_permissions(user_id: $user_id) { user_id role permissions role_defaults }
  }
`;
const SET_PERMISSIONS = gql`
  mutation SetUserPermissions($user_id: ID!, $permissions: [String!]!) {
    set_user_permissions(user_id: $user_id, permissions: $permissions) { success message }
  }
`;
const MY_PERMISSIONS = gql`
  query MyPermissionsAfterSave { my_permissions }
`;

interface Info {
  user_id: string;
  role: string;
  permissions: string[];
  role_defaults: string[];
}

const sameSet = (a: Set<string>, b: Set<string>) => a.size === b.size && [...a].every((x) => b.has(x));

export default function Permissions() {
  const { t } = useTranslation();
  const roleLabel = useRoleLabel();
  const [params, setParams] = useSearchParams();
  const { data, loading, error } = useQuery<{ users: UserRow[] }>(USERS, { fetchPolicy: "network-only" });

  // Only active staff accounts have editable permissions; kiosks are scoped
  // by the server and inactive users can't sign in.
  const staff = useMemo(
    () =>
      (data?.users ?? [])
        .filter((u) => normalizeRole(u.role) && u.is_active)
        .sort((a, b) => a.display_name.localeCompare(b.display_name)),
    [data]
  );
  const selectedId = params.get("user") ?? staff[0]?.user_id ?? null;
  const selected = staff.find((u) => u.user_id === selectedId) ?? null;

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
      <PageHeader titleKey="permissions.title" subtitle={t("permissions.subtitle")} />

      <div className="grid gap-4 md:grid-cols-[16rem_1fr]">
        {/* Who */}
        <nav aria-label={t("permissions.pickUser")} className="overflow-hidden rounded-lg border border-rule bg-card">
          <ul className="divide-y divide-rule">
            {staff.map((u) => (
              <li key={u.user_id}>
                <button
                  type="button"
                  onClick={() => setParams({ user: u.user_id })}
                  aria-current={u.user_id === selectedId ? "true" : undefined}
                  className={cn(
                    "flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-wash/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                    u.user_id === selectedId && "bg-wash font-medium"
                  )}
                >
                  <span className="min-w-0 truncate text-ink">{u.display_name}</span>
                  <span className="shrink-0 text-caption text-ink-soft">{roleLabel(u.role)}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* What */}
        {selected ? (
          <PermissionEditor key={selected.user_id} user={selected} />
        ) : (
          <div className="rounded-lg border border-rule bg-card">
            <EmptyState icon={ShieldCheck} title={t("permissions.noUser")} />
          </div>
        )}
      </div>
    </div>
  );
}

function PermissionEditor({ user }: { user: UserRow }) {
  const { t } = useTranslation();
  const roleLabel = useRoleLabel();
  const client = useApolloClient();
  const isMe = user.user_id === localStorage.getItem("user_id");
  const { data, loading, error, refetch } = useQuery<{ user_permissions: Info }>(USER_PERMISSIONS, {
    variables: { user_id: user.user_id },
    fetchPolicy: "network-only",
  });
  const [save, { loading: saving }] = useMutation<{ set_user_permissions: { success: boolean; message?: string } }>(
    SET_PERMISSIONS
  );

  const info = data?.user_permissions;
  const saved = useMemo(() => new Set(info?.permissions ?? []), [info]);
  const defaults = useMemo(() => new Set(info?.role_defaults ?? []), [info]);
  const [draft, setDraft] = useState<Set<string>>(new Set());
  const [problem, setProblem] = useState("");

  useEffect(() => setDraft(new Set(saved)), [saved]);

  if (loading && !info) return <Skeleton className="h-64 w-full" />;
  if (error || !info) {
    return (
      <p className="flex items-center gap-2 p-4 text-sm text-void-deep" role="alert">
        <AlertCircle className="h-4 w-4 shrink-0 text-void" aria-hidden="true" />
        {error?.message}
      </p>
    );
  }

  const dirty = !sameSet(draft, saved);
  const atDefaults = sameSet(draft, defaults);

  const toggle = (p: Permission, on: boolean) => {
    setDraft((d) => {
      const next = new Set(d);
      if (on) next.add(p);
      else next.delete(p);
      return next;
    });
  };

  const submit = async () => {
    setProblem("");
    try {
      const list = PERMISSIONS.filter((p) => draft.has(p));
      const res = (await save({ variables: { user_id: user.user_id, permissions: list } })).data?.set_user_permissions;
      if (!res?.success) return setProblem(res?.message || t("users.saveFailed"));
      toast.success(t("permissions.saved"));
      await refetch();
      // Editing yourself changes your own menu right away.
      if (isMe) {
        const mine = await client.query<{ my_permissions: string[] }>({ query: MY_PERMISSIONS, fetchPolicy: "network-only" });
        setPermissions(mine.data.my_permissions);
      }
    } catch (e) {
      setProblem(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <section className="rounded-lg border border-rule bg-card" aria-labelledby="perm-heading">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-rule px-4 py-3">
        <div>
          <h2 id="perm-heading" className="text-base font-semibold text-ink">{user.display_name}</h2>
          <p className="text-caption text-ink-soft">
            {t("permissions.roleLine", { role: roleLabel(info.role) })}
            {" · "}
            {atDefaults ? t("permissions.usingDefaults") : t("permissions.customised")}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setDraft(new Set(defaults))}
            disabled={atDefaults || saving}
            title={t("permissions.resetHint")}
          >
            <RotateCcw aria-hidden="true" /> {t("permissions.reset")}
          </Button>
          <Button onClick={submit} disabled={!dirty || saving}>
            {saving ? t("common.saving") : t("common.save")}
          </Button>
        </div>
      </header>

      <div className="space-y-5 px-4 py-4">
        {PERMISSION_GROUPS.map((g) => (
          <fieldset key={g.key} className="space-y-3">
            <legend className="mb-2 text-caption font-semibold uppercase tracking-wide text-ink-soft">
              {t(`permissions.groups.${g.key}`)}
            </legend>
            {g.permissions.map((p) => {
              const lockedSelf = isMe && p === "user.manage";
              const differs = draft.has(p) !== defaults.has(p);
              return (
                <Checkbox
                  key={p}
                  checked={draft.has(p)}
                  onChange={(on) => toggle(p, on)}
                  disabled={lockedSelf || saving}
                  label={
                    <span className="inline-flex items-center gap-2">
                      {t(`permissions.items.${p}.label`)}
                      {differs && (
                        <Chip tone="notice">{draft.has(p) ? t("permissions.added") : t("permissions.removed")}</Chip>
                      )}
                    </span>
                  }
                  description={lockedSelf ? t("permissions.cannotRemoveOwn") : t(`permissions.items.${p}.description`)}
                />
              );
            })}
          </fieldset>
        ))}
        {problem && <p className="text-sm text-void-deep" role="alert">{problem}</p>}
      </div>
    </section>
  );
}
