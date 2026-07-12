export interface Repository {
  id: string;
  path: string;
  remote_url: string | null;
  current_account_id: string | null;
  current_account_name: string | null;
  provider: string | null;
  last_opened: string | null;
  created_at: string;
}

export interface GitStatus {
  branch: string;
  changes: number;
  staged: number;
  unstaged: number;
  is_clean: boolean;
  ahead: number;
  behind: number;
}
