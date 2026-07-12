export interface GitAccount {
  id: string;
  provider: "github" | "gitlab" | "bitbucket" | "custom";
  display_name: string;
  username: string;
  email: string;
  avatar_url: string | null;
  token_reference: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateAccountInput {
  provider: string;
  display_name: string;
  username: string;
  email: string;
  token?: string;
}

export interface UpdateAccountInput {
  display_name?: string;
  username?: string;
  email?: string;
  avatar_url?: string | null;
}
