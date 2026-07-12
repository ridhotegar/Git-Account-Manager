import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FolderGit2,
  FolderOpen,
  GitBranch,
  Loader2,
  CheckCircle2,
  AlertCircle,
  GitCommitHorizontal,
  RefreshCw,
  Trash2,
  AlertTriangle,
  Globe,
  HardDrive,
  Database,
  X,
} from "lucide-react";
import {
  getRepositories,
  scanRepository,
  getGitStatus,
  getAccounts,
  switchAccount,
  deleteRepository,
  deleteRepoFolder,
  deleteRemoteRepo,
} from "@/lib/tauri";
import { useAccountStore } from "@/stores/account-store";

export function Repositories() {
  const [repos, setRepos] = useState<any[]>([]);
  const [statusMap, setStatusMap] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [statusLoading, setStatusLoading] = useState<Record<string, boolean>>(
    {}
  );

  // Delete dialog state
  const [repoToDelete, setRepoToDelete] = useState<any | null>(null);
  const [deleteLocalFolder, setDeleteLocalFolder] = useState(false);
  const [deleteRemote, setDeleteRemote] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const { accounts } = useAccountStore();

  const clearMsgs = useCallback(() => {
    setError(null);
    setSuccessMessage(null);
  }, []);

  const loadRepos = useCallback(async () => {
    try {
      const data = await getRepositories();
      setRepos(data);
      for (const repo of data) {
        loadStatus(repo.path);
      }
    } catch (err) {
      setError(typeof err === "string" ? err : "Failed to load repositories");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadStatus = async (path: string) => {
    setStatusLoading((prev) => ({ ...prev, [path]: true }));
    try {
      const status = await getGitStatus(path);
      setStatusMap((prev) => ({ ...prev, [path]: status }));
    } catch {
      // Git status might fail
    } finally {
      setStatusLoading((prev) => ({ ...prev, [path]: false }));
    }
  };

  useEffect(() => {
    loadRepos();
  }, [loadRepos]);

  const getRepoName = (path: string) =>
    path.split("\\").pop()?.split("/").pop() || path;

  const handleAddFolder = async () => {
    let openFn;
    try {
      const dialog = await import("@tauri-apps/plugin-dialog");
      openFn = dialog.open;
    } catch {
      setError("Folder picker is only available in the desktop app");
      setTimeout(clearMsgs, 5000);
      return;
    }

    setIsAdding(true);
    setError(null);

    try {
      const selected = await openFn({
        directory: true,
        multiple: false,
        title: "Select a Git Repository",
      });

      if (selected && typeof selected === "string") {
        await scanRepository(selected);
        setSuccessMessage("Repository added successfully");
        setTimeout(clearMsgs, 4000);
        await loadRepos();
      }
    } catch (err) {
      setError(
        typeof err === "string"
          ? err
          : "Not a valid Git repository or the folder doesn't exist"
      );
      setTimeout(clearMsgs, 5000);
    } finally {
      setIsAdding(false);
    }
  };

  const handleAssignAccount = async (repoId: string, accountId: string) => {
    const repo = repos.find((r) => r.id === repoId);
    if (!repo) return;
    try {
      await switchAccount(repo.path, accountId);
      setSuccessMessage("Account assigned to repository");
      setTimeout(clearMsgs, 3000);
      await loadRepos();
    } catch (err) {
      setError(
        typeof err === "string" ? err : "Failed to assign account to repo"
      );
    }
  };

  const openDeleteDialog = (repo: any) => {
    setRepoToDelete(repo);
    setDeleteLocalFolder(false);
    setDeleteRemote(false);
  };

  const handleConfirmDelete = async () => {
    if (!repoToDelete) return;
    setIsDeleting(true);
    setError(null);

    const repoName = getRepoName(repoToDelete.path);
    const actions: string[] = [];

    try {
      // 1. Remove from database (always)
      await deleteRepository(repoToDelete.id);
      actions.push("removed from list");

      // 2. Delete local folder (if checked)
      if (deleteLocalFolder) {
        await deleteRepoFolder(repoToDelete.path);
        actions.push("local folder deleted");
      }

      // 3. Delete on remote (if checked)
      if (deleteRemote) {
        await deleteRemoteRepo(repoToDelete.id);
        actions.push("deleted on remote");
      }

      setSuccessMessage(`${repoName} — ${actions.join(", ")}`);
      setTimeout(clearMsgs, 5000);
      setRepoToDelete(null);
      await loadRepos();
    } catch (err) {
      const msg = typeof err === "string" ? err : "Failed to delete repository";
      // If DB delete already happened, we need to reload regardless
      if (actions.length > 0) {
        await loadRepos();
      }
      setError(msg);
      setTimeout(clearMsgs, 6000);
    } finally {
      setIsDeleting(false);
    }
  };

  const activeAccounts = accounts.filter((a: any) => a.is_active);
  const totalChanges = Object.values(statusMap).reduce(
    (sum: number, s: any) => sum + (s?.changes || 0),
    0
  );
  const cleanRepos = Object.values(statusMap).filter(
    (s: any) => s?.is_clean
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Repositories</h2>
          <p className="text-muted-foreground">
            Add and manage Git repositories on your system
          </p>
        </div>
        <Button size="sm" onClick={handleAddFolder} disabled={isAdding}>
          {isAdding ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <FolderOpen className="mr-2 h-4 w-4" />
          )}
          {isAdding ? "Adding..." : "Add Folder"}
        </Button>
      </div>

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

      {/* Delete Confirmation Dialog */}
      {repoToDelete && (
        <Card className="border-destructive/30 bg-destructive/5 animate-fade-in">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-destructive/10 p-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <h3 className="font-semibold">
                    Delete "{getRepoName(repoToDelete.path)}"
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Choose what to delete
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 -mr-2 -mt-2"
                onClick={() => setRepoToDelete(null)}
                disabled={isDeleting}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-3">
              {/* Always remove from list */}
              <label className="flex items-center gap-3 rounded-lg border bg-background p-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={true}
                  disabled
                  className="h-4 w-4 accent-primary"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium">Remove from app list</p>
                  <p className="text-xs text-muted-foreground">
                    Untrack this repository in Git Account Manager
                  </p>
                </div>
                <Database className="h-4 w-4 text-muted-foreground shrink-0" />
              </label>

              {/* Also delete local folder */}
              <label className="flex items-center gap-3 rounded-lg border bg-background p-3 cursor-pointer hover:border-muted-foreground/30 transition-colors">
                <input
                  type="checkbox"
                  checked={deleteLocalFolder}
                  onChange={(e) => setDeleteLocalFolder(e.target.checked)}
                  className="h-4 w-4 accent-destructive"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium">Delete local folder</p>
                  <p className="text-xs text-muted-foreground">
                    Permanently delete this repository from your computer
                  </p>
                </div>
                <HardDrive className="h-4 w-4 text-muted-foreground shrink-0" />
              </label>

              {/* Also delete on remote — only if repo has a remote URL and an assigned account */}
              {repoToDelete.remote_url && repoToDelete.current_account_id && (
                <label className="flex items-center gap-3 rounded-lg border bg-background p-3 cursor-pointer hover:border-muted-foreground/30 transition-colors">
                  <input
                    type="checkbox"
                    checked={deleteRemote}
                    onChange={(e) => setDeleteRemote(e.target.checked)}
                    className="h-4 w-4 accent-destructive"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      Delete on{" "}
                      {repoToDelete.provider
                        ? repoToDelete.provider.charAt(0).toUpperCase() +
                          repoToDelete.provider.slice(1)
                        : "remote"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Permanently delete the remote repository
                    </p>
                  </div>
                  <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
                </label>
              )}
            </div>

            <div className="flex justify-end gap-2 mt-4 pt-2 border-t border-border">
              <Button
                variant="outline"
                onClick={() => setRepoToDelete(null)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-lg bg-muted p-2">
              <FolderGit2 className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-xl font-bold">{repos.length}</p>
              <p className="text-xs text-muted-foreground">Tracked Repos</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-lg bg-emerald-500/10 p-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-xl font-bold">{cleanRepos}</p>
              <p className="text-xs text-muted-foreground">Clean</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-lg bg-amber-500/10 p-2">
              <GitCommitHorizontal className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-xl font-bold">{totalChanges}</p>
              <p className="text-xs text-muted-foreground">Uncommitted</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-lg bg-muted p-2">
              <GitBranch className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-xl font-bold">
                {activeAccounts.length > 0
                  ? activeAccounts[0]?.display_name?.charAt(0) || "—"
                  : "—"}
              </p>
              <p className="text-xs text-muted-foreground">Active Account</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Repository List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Tracked Repositories</CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={loadRepos}
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : repos.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-12 text-center">
              <div className="rounded-full bg-muted p-4">
                <FolderGit2 className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium">No repositories tracked</p>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Click "Add Folder" to browse for a Git repository on your
                  machine.
                </p>
              </div>
              <Button
                variant="default"
                onClick={handleAddFolder}
                disabled={isAdding}
              >
                <FolderOpen className="mr-2 h-4 w-4" />
                Browse for Repository
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {repos.map((repo: any) => {
                const status = statusMap[repo.path];
                const isStatusLoading = statusLoading[repo.path];
                return (
                  <div
                    key={repo.id}
                    className="flex flex-col sm:flex-row sm:items-center gap-3 py-4 group"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <FolderGit2 className="h-5 w-5 text-muted-foreground shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm truncate">
                            {getRepoName(repo.path)}
                          </p>
                          {repo.provider && (
                            <Badge
                              variant="secondary"
                              className="text-[10px] uppercase"
                            >
                              {repo.provider}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate font-mono">
                          {repo.path}
                        </p>
                      </div>
                    </div>

                    {/* Status section */}
                    <div className="flex items-center gap-3 shrink-0">
                      {isStatusLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      ) : status ? (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <GitBranch className="h-3.5 w-3.5" />
                          <span>{status.branch}</span>
                          {status.changes > 0 && (
                            <span className="text-amber-500 font-medium">
                              +{status.changes}
                            </span>
                          )}
                          {status.is_clean && (
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                          )}
                          {(status.ahead > 0 || status.behind > 0) && (
                            <span className="text-blue-500">
                              ↑{status.ahead} ↓{status.behind}
                            </span>
                          )}
                        </div>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => loadStatus(repo.path)}
                        >
                          Load Status
                        </Button>
                      )}

                      {/* Assign account dropdown */}
                      {accounts.length > 0 && (
                        <select
                          className="text-xs bg-muted rounded border-0 px-2 py-1 max-w-[120px]"
                          value={repo.current_account_id || ""}
                          onChange={(e) =>
                            e.target.value &&
                            handleAssignAccount(repo.id, e.target.value)
                          }
                        >
                          <option value="">
                            {repo.current_account_name || "No account"}
                          </option>
                          {accounts
                            .filter(
                              (a: any) => a.id !== repo.current_account_id
                            )
                            .map((a: any) => (
                              <option key={a.id} value={a.id}>
                                {a.display_name}
                              </option>
                            ))}
                        </select>
                      )}

                      {/* Delete button */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-all"
                        onClick={() => openDeleteDialog(repo)}
                        title="Delete repository"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
