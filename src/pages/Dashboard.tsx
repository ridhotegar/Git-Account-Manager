import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { useAccountStore } from "@/stores/account-store";
import {
  detectGitConfig,
  checkGitInstallation,
  getAccounts,
  type GlobalGitConfig,
} from "@/lib/tauri";
import {
  Users,
  FolderGit2,
  GitBranch,
  ArrowRight,
  Plus,
  User,
  Loader2,
  Github,
  Gitlab,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const PROVIDER_ICONS: Record<string, any> = {
  github: Github,
  gitlab: Gitlab,
  bitbucket: Users,
};

export function Dashboard() {
  const { accounts, activeAccount, setAccounts, setActiveAccount } =
    useAccountStore();
  const navigate = useNavigate();
  const [gitConfig, setGitConfig] = useState<GlobalGitConfig | null>(null);
  const [gitVersion, setGitVersion] = useState<string | null>(null);
  const [isLoadingGit, setIsLoadingGit] = useState(true);

  useEffect(() => {
    loadGitInfo();
    refreshAccounts();
  }, []);

  const refreshAccounts = async () => {
    try {
      const accs = await getAccounts();
      setAccounts(accs);
      const active = accs.find((a: any) => a.is_active);
      if (active) setActiveAccount(active);
    } catch {
      // Silently fail — accounts might not be loaded yet
    }
  };

  const loadGitInfo = async () => {
    try {
      setIsLoadingGit(true);
      const [config, version] = await Promise.all([
        detectGitConfig(),
        checkGitInstallation(),
      ]);
      setGitConfig(config);
      setGitVersion(version);
    } catch {
      setGitConfig(null);
      setGitVersion(null);
    } finally {
      setIsLoadingGit(false);
    }
  };

  const stats = [
    {
      label: "Accounts",
      value: accounts.length,
      icon: Users,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      href: "/accounts",
    },
    {
      label: "Active Identity",
      value: activeAccount?.display_name?.split(" ")[0] || "None",
      icon: User,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      href: "/accounts",
    },
    {
      label: "Git",
      value: gitVersion
        ? gitVersion.replace("git version ", "").split(".").slice(0, 2).join(".")
        : "—",
      icon: GitBranch,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            {activeAccount
              ? `Hi, ${activeAccount.display_name.split(" ")[0]}`
              : "Welcome"}
          </h2>
          <p className="text-muted-foreground">
            {activeAccount
              ? `Signed in as ${activeAccount.username} · ${activeAccount.provider}`
              : "Add a Git account to get started"}
          </p>
        </div>
        {!activeAccount && (
          <Button onClick={() => navigate("/accounts")}>
            <Plus className="mr-2 h-4 w-4" />
            Add Account
          </Button>
        )}
      </div>

      {/* Stats row */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <button
              key={stat.label}
              onClick={() => stat.href && navigate(stat.href)}
              className={`text-left ${
                stat.href ? "cursor-pointer" : "cursor-default"
              }`}
            >
              <Card className="transition-all hover:shadow-md h-full">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`rounded-lg ${stat.bg} p-2`}>
                      {isLoadingGit && stat.label === "Git" ? (
                        <Loader2
                          className={`h-5 w-5 animate-spin ${stat.color}`}
                        />
                      ) : (
                        <Icon className={`h-5 w-5 ${stat.color}`} />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-lg font-bold truncate">
                        {typeof stat.value === "number"
                          ? stat.value
                          : stat.value}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {stat.label}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </button>
          );
        })}
      </div>

      {/* Active Identity — combines account + git config */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4" />
            Active Identity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activeAccount ? (
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <Avatar
                  src={activeAccount.avatar_url}
                  fallback={activeAccount.display_name.charAt(0)}
                  className="h-12 w-12 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold truncate">
                    {activeAccount.display_name}
                  </p>
                  <p className="text-sm text-muted-foreground truncate">
                    {activeAccount.username} · {activeAccount.provider}
                  </p>
                  <p className="text-sm text-muted-foreground truncate">
                    {activeAccount.email}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 sm:flex-col sm:items-end shrink-0">
                <Badge variant="success">Active</Badge>
                {isLoadingGit ? (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                ) : gitVersion && (
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    Git {gitVersion.replace("git version ", "").split(".").slice(0, 2).join(".")}
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <Users className="h-10 w-10 text-muted-foreground/40" />
              <div>
                <p className="font-medium">No active account</p>
                <p className="text-sm text-muted-foreground">
                  Add a Git account to set your global identity
                </p>
              </div>
              <Button
                variant="default"
                size="sm"
                onClick={() => navigate("/accounts")}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Account
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-3">
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => navigate("/repositories")}
            >
              <FolderGit2 className="mr-2 h-4 w-4 shrink-0" />
              <span className="truncate">Scan Repos</span>
              <ArrowRight className="ml-auto h-4 w-4 shrink-0" />
            </Button>
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => navigate("/accounts")}
            >
              <Users className="mr-2 h-4 w-4 shrink-0" />
              <span className="truncate">Add Account</span>
              <ArrowRight className="ml-auto h-4 w-4 shrink-0" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* All Accounts preview */}
      {accounts.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">All Accounts</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate("/accounts")}>
              Manage
              <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-border">
              {accounts.slice(0, 5).map((account) => {
                const ProviderIcon =
                  PROVIDER_ICONS[account.provider] || Users;
                return (
                  <div
                    key={account.id}
                    className="flex items-center gap-3 py-2.5"
                  >
                    <Avatar
                      src={account.avatar_url}
                      fallback={account.display_name.charAt(0)}
                      className="h-8 w-8"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {account.display_name}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <ProviderIcon className="h-3 w-3" />
                        {account.username}
                      </p>
                    </div>
                    <Badge
                      variant={account.is_active ? "success" : "secondary"}
                      className="shrink-0"
                    >
                      {account.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
