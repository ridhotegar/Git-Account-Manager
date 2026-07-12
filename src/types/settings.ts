export type Theme = "light" | "dark" | "system";

export interface AppSettings {
  theme: Theme;
  git_path: string | null;
  auto_detect_repos: boolean;
  minimize_to_tray: boolean;
  start_on_boot: boolean;
  default_provider: string;
}
