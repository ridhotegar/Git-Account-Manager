import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { useAccountStore } from "@/stores/account-store";
import {
  createAccount,
  getAccounts,
  verifyAndStoreGithubToken,
  storeCredential,
  setGlobalActiveAccount,
  deleteAccount,
} from "@/lib/tauri";
import {
  Users,
  Plus,
  Pencil,
  Trash2,
  Github,
  Gitlab,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
  Eye,
  EyeOff,
  User,
  AtSign,
  KeyRound,
} from "lucide-react";

const PROVIDERS = [
  {
    value: "github",
    label: "GitHub",
    icon: Github,
    color: "text-gray-900 dark:text-white",
  },
  {
    value: "gitlab",
    label: "GitLab",
    icon: Gitlab,
    color: "text-orange-500",
  },
  {
    value: "bitbucket",
    label: "Bitbucket",
    icon: Users,
    color: "text-blue-500",
  },
  {
    value: "custom",
    label: "Custom",
    icon: Users,
    color: "text-muted-foreground",
  },
];

export function Accounts() {
  const { accounts, activeAccount, setActiveAccount, setAccounts, removeAccount } =
    useAccountStore();
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Manual entry dialog state
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualProvider, setManualProvider] = useState("github");
  const [manualUsername, setManualUsername] = useState("");
  const [manualToken, setManualToken] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const clearError = () => setError(null);
  const clearSuccess = () => setSuccessMessage(null);

  const reloadAndSetActive = async () => {
    const reloaded = await getAccounts();
    setAccounts(reloaded);
    const active = reloaded.find((a: any) => a.is_active);
    if (active) setActiveAccount(active);
    return active;
  };

  const handleOpenManualEntry = () => {
    setShowManualEntry(true);
    setError(null);
    setManualProvider("github");
    setManualUsername("");
    setManualToken("");
    setShowToken(false);
  };

  const handleManualSubmit = async () => {
    if (!manualToken) {
      setError("Token is required");
      setTimeout(clearError, 5000);
      return;
    }
    if (manualProvider !== "github" && !manualUsername) {
      setError("Username is required");
      setTimeout(clearError, 5000);
      return;
    }

    setIsVerifying(true);
    setError(null);

    try {
      if (manualProvider === "github") {
        const result = await verifyAndStoreGithubToken(manualToken);
        await createAccount({
          provider: "github",
          display_name: result.name || result.login,
          username: result.login,
          email: result.email || `${result.login}@users.noreply.github.com`,
          token: result.token_reference,
        });
      } else {
        const tokenRef = await storeCredential(manualProvider, manualUsername, manualToken);
        await createAccount({
          provider: manualProvider,
          display_name: manualUsername,
          username: manualUsername,
          email: `${manualUsername}@${manualProvider}.com`,
          token: tokenRef,
        });
      }

      // Get the newly created account and make it active
      const accounts = await getAccounts();
      const newest = accounts[0]; // Most recent first
      if (newest) {
        await setGlobalActiveAccount(newest.id);
      }

      const active = await reloadAndSetActive();
      setShowManualEntry(false);
      setSuccessMessage(
        `Connected as ${active?.display_name || manualUsername}`
      );
      setTimeout(clearSuccess, 5000);
    } catch (err) {
      setError(typeof err === "string" ? err : "Failed to add account");
      setTimeout(clearError, 8000);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSetActive = async (account: any) => {
    try {
      await setGlobalActiveAccount(account.id);
      await reloadAndSetActive();
      setSuccessMessage(`Switched to ${account.display_name}`);
      setTimeout(clearSuccess, 3000);
    } catch (err) {
      setError(typeof err === "string" ? err : "Failed to switch account");
      setTimeout(clearError, 5000);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteAccount(id);
      await reloadAndSetActive();
    } catch (err) {
      setError(typeof err === "string" ? err : "Failed to delete account");
      setTimeout(clearError, 5000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Accounts</h2>
          <p className="text-muted-foreground">
            Manage your Git provider accounts and identities
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={handleOpenManualEntry}>
            <Plus className="mr-2 h-4 w-4" />
            Add Account
          </Button>
        </div>
      </div>

      {/* Manual Entry Dialog */}
      {showManualEntry && (
        <Card className="border-primary/30 bg-primary/5 animate-fade-in">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5" />
                <h3 className="font-semibold">Add Account</h3>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 -mr-2 -mt-2"
                onClick={() => setShowManualEntry(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4">
              {/* Provider */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Choose a provider
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {PROVIDERS.map((p) => {
                    const Icon = p.icon;
                    const isActive = manualProvider === p.value;
                    return (
                      <Button
                        key={p.value}
                        variant={isActive ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          setManualProvider(p.value);
                          setManualUsername("");
                          setManualToken("");
                        }}
                        className="flex items-center justify-center gap-1.5"
                      >
                        <Icon className="h-4 w-4" />
                        {p.label}
                      </Button>
                    );
                  })}
                </div>
              </div>

              {/* GitHub: only token field */}
              {manualProvider === "github" ? (
                <div>
                  <label className="text-sm font-medium mb-1.5 block">
                    Personal Access Token <span className="text-destructive">*</span>
                  </label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type={showToken ? "text" : "password"}
                      placeholder="ghp_... or github_pat_..."
                      value={manualToken}
                      onChange={(e) => setManualToken(e.target.value)}
                      className="pl-9 pr-9"
                      autoFocus
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                      onClick={() => setShowToken(!showToken)}
                    >
                      {showToken ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Your username, name, and email are auto-detected from
                    GitHub. Create a token at{" "}
                    <a
                      href="https://github.com/settings/tokens"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline underline-offset-2"
                    >
                      github.com/settings/tokens
                    </a>{" "}
                    with <code className="text-[10px] bg-muted px-1 py-0.5 rounded">repo</code> and{" "}
                    <code className="text-[10px] bg-muted px-1 py-0.5 rounded">user</code> scopes.
                  </p>
                </div>
              ) : (
                <>
                  {/* Username (required for non-GitHub) */}
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">
                      Username <span className="text-destructive">*</span>
                    </label>
                    <div className="relative">
                      <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Your GitLab / Bitbucket username"
                        value={manualUsername}
                        onChange={(e) => setManualUsername(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                  </div>

                  {/* Token (required) */}
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">
                      Token / Password <span className="text-destructive">*</span>
                    </label>
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type={showToken ? "text" : "password"}
                        placeholder={
                          manualProvider === "gitlab"
                            ? "GitLab Personal Access Token"
                            : "Enter your access token"
                        }
                        value={manualToken}
                        onChange={(e) => setManualToken(e.target.value)}
                        className="pl-9 pr-9"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                        onClick={() => setShowToken(!showToken)}
                      >
                        {showToken ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    {manualProvider === "gitlab" && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Create a token at{" "}
                        <a
                          href="https://gitlab.com/-/user_settings/personal_access_tokens"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary underline underline-offset-2"
                        >
                          gitlab.com/-/user_settings/personal_access_tokens
                        </a>{" "}
                        with <code className="text-[10px] bg-muted px-1 py-0.5 rounded">read_repository</code> scope.
                      </p>
                    )}
                  </div>
                </>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setShowManualEntry(false)}
                  disabled={isVerifying}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleManualSubmit}
                  disabled={
                    isVerifying ||
                    !manualToken ||
                    (manualProvider !== "github" && !manualUsername)
                  }
                >
                  {isVerifying ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : manualProvider === "github" ? (
                    "Verify & Connect"
                  ) : (
                    "Add Account"
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status Messages */}
      {error && (
        <div className="flex items-center gap-3 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive animate-fade-in">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {successMessage && (
        <div className="flex items-center gap-3 rounded-lg border border-emerald-500/50 bg-emerald-500/10 p-4 text-sm text-emerald-600 dark:text-emerald-400 animate-fade-in">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Accounts List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">All Accounts</CardTitle>
        </CardHeader>
        <CardContent>
          {accounts.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-12 text-center">
              <div className="rounded-full bg-muted p-4">
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium">No accounts</p>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Add your first Git account by entering your details below.
                </p>
              </div>
              <Button variant="default" onClick={handleOpenManualEntry}>
                <Plus className="mr-2 h-4 w-4" />
                Add Account
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {accounts.map((account) => (
                <div
                  key={account.id}
                  className="flex items-center gap-4 py-4 group"
                >
                  <Avatar
                    src={account.avatar_url}
                    fallback={account.display_name.charAt(0)}
                    className="h-10 w-10"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate">
                        {account.display_name}
                      </p>
                      <Badge
                        variant="secondary"
                        className="text-[10px] uppercase"
                      >
                        {account.provider}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {account.email}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!account.is_active && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs"
                        onClick={() => handleSetActive(account)}
                      >
                        Set Active
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(account.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  {account.is_active && <Badge variant="success">Active</Badge>}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
