/**
 * Tauri API wrapper module.
 * All communication with the Rust backend goes through this module.
 * Note: These functions will only work when running inside Tauri.
 * During development in the browser, they return mock data or errors.
 */

// We use dynamic imports for Tauri API to support browser dev mode
let invoke: any = null;

/** Safely extract an error message from any thrown value (string, Error, or unknown). */
function getErrorMessage(err: unknown): string {
  if (typeof err === "string") return err;
  if (err instanceof Error) return err.message;
  return "An unexpected error occurred";
}

async function getInvoke() {
  if (!invoke) {
    try {
      const tauri = await import("@tauri-apps/api/core");
      const rawInvoke = tauri.invoke;
      // Wrap invoke to guarantee string errors
      invoke = async (cmd: string, args?: any) => {
        try {
          return await rawInvoke(cmd, args);
        } catch (err) {
          throw getErrorMessage(err);
        }
      };
    } catch {
      // Running outside Tauri (browser dev mode)
      invoke = async () => {
        throw "Tauri backend is not available in browser mode";
      };
    }
  }
  return invoke;
}

// ==========================================
// Backend Types
// ==========================================

export interface AppSettings {
  theme: string;
  git_path: string | null;
  minimize_to_tray: boolean;
  start_on_boot: boolean;
  default_provider: string;
  github_client_id: string | null;
}

export interface GlobalGitConfig {
  name: string | null;
  email: string | null;
}

export interface VerifiedTokenResult {
  login: string;
  name: string | null;
  email: string | null;
  avatar_url: string;
  token_reference: string;
}

// ==========================================
// Account Commands
// ==========================================

export async function getAccounts(): Promise<any[]> {
  const fn = await getInvoke();
  return fn("get_accounts");
}

export async function createAccount(data: {
  provider: string;
  display_name: string;
  username: string;
  email: string;
  token?: string;
}): Promise<any> {
  const fn = await getInvoke();
  return fn("create_account", { data });
}

export async function updateAccount(id: string, data: any): Promise<any> {
  const fn = await getInvoke();
  return fn("update_account", { id, data });
}

export async function deleteAccount(id: string): Promise<void> {
  const fn = await getInvoke();
  return fn("delete_account", { id });
}

export async function setActiveAccount(id: string): Promise<any> {
  const fn = await getInvoke();
  return fn("set_active_account", { id });
}

/**
 * Set an account as the active global Git identity.
 * This updates the database AND runs `git config --global` to apply
 * the account's name and email system-wide.
 */
export async function setGlobalActiveAccount(id: string): Promise<any> {
  const fn = await getInvoke();
  return fn("set_global_active_account", { id });
}

// ==========================================
// Repository Commands
// ==========================================

export async function getRepositories(): Promise<any[]> {
  const fn = await getInvoke();
  return fn("get_repositories");
}

export async function scanRepository(path: string): Promise<any> {
  const fn = await getInvoke();
  return fn("scan_repository", { path });
}

export async function deleteRepository(id: string): Promise<void> {
  const fn = await getInvoke();
  return fn("delete_repository", { id });
}

export async function deleteRepoFolder(path: string): Promise<void> {
  const fn = await getInvoke();
  return fn("delete_repo_folder", { path });
}

export async function deleteRemoteRepo(repoId: string): Promise<void> {
  const fn = await getInvoke();
  return fn("delete_remote_repo", { repoId });
}

// ==========================================
// Git Commands
// ==========================================

export async function switchAccount(repoPath: string, accountId: string): Promise<void> {
  const fn = await getInvoke();
  return fn("switch_account", { repoPath, accountId });
}

export async function getGitStatus(repoPath: string): Promise<any> {
  const fn = await getInvoke();
  return fn("get_git_status", { repoPath });
}

export async function checkGitInstallation(): Promise<any> {
  const fn = await getInvoke();
  return fn("check_git_installation");
}

export async function detectGitConfig(): Promise<GlobalGitConfig> {
  const fn = await getInvoke();
  return fn("detect_git_config");
}

// ==========================================
// Settings Commands
// ==========================================

export async function getSettings(): Promise<AppSettings> {
  const fn = await getInvoke();
  return fn("get_settings");
}

export async function updateSettings(settings: AppSettings): Promise<AppSettings> {
  const fn = await getInvoke();
  return fn("update_settings", { settings });
}

// ==========================================
// Portable Build Detection
// ==========================================

/** Returns true if the app was built in portable mode. */
export async function isPortable(): Promise<boolean> {
  const fn = await getInvoke();
  return fn("is_portable");
}

// ==========================================
// Utility Commands
// ==========================================

/** Open a URL in the system browser. */
export async function openUrl(url: string): Promise<void> {
  const fn = await getInvoke();
  return fn("open_url", { url });
}

// ==========================================
// Auth Commands (Token Management)
// ==========================================

/**
 * Verify a GitHub Personal Access Token against the GitHub API and store it
 * securely in the OS credential manager.
 * Returns the authenticated user's info, ready to create an account.
 */
export async function verifyAndStoreGithubToken(
  token: string,
): Promise<VerifiedTokenResult> {
  const fn = await getInvoke();
  return fn("verify_and_store_github_token", { token });
}

/**
 * Store an access token for any provider in the OS credential manager.
 * Returns the token reference key to use when creating an account.
 */
export async function storeCredential(
  provider: string,
  username: string,
  token: string,
): Promise<string> {
  const fn = await getInvoke();
  return fn("store_credential", { provider, username, token });
}
