import { useLocation, useNavigate } from "react-router-dom";
import { Moon, Sun, Monitor, ChevronDown, Users, Plus, Check } from "lucide-react";
import { useThemeStore } from "@/stores/theme-store";
import { useAccountStore } from "@/stores/account-store";
import { setGlobalActiveAccount, getAccounts } from "@/lib/tauri";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

const pageTitles: Record<string, string> = {
  "/": "Dashboard",
  "/accounts": "Accounts",
  "/repositories": "Repositories",
  "/settings": "Settings",
  "/about": "About",
};

export function TopBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, setTheme } = useThemeStore();
  const { accounts, activeAccount, setActiveAccount, setAccounts } =
    useAccountStore();
  const title = pageTitles[location.pathname] || "Dashboard";

  const themeIcon = {
    light: Sun,
    dark: Moon,
    system: Monitor,
  }[theme];

  const ThemeIcon = themeIcon;

  const handleSwitchAccount = async (id: string) => {
    try {
      await setGlobalActiveAccount(id);
      // Reload from backend to keep store in sync
      const reloaded = await getAccounts();
      setAccounts(reloaded);
      const active = reloaded.find((a: any) => a.is_active);
      if (active) setActiveAccount(active);
    } catch {
      // Silent fail — user can still switch from Accounts page
    }
  };

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6 lg:px-8">
      {/* Page Title */}
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-semibold text-foreground">{title}</h1>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2">
        {/* Theme Toggle */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <ThemeIcon className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-36">
            <DropdownMenuLabel>Theme</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setTheme("light")}>
              <Sun className="mr-2 h-4 w-4" />
              Light
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("dark")}>
              <Moon className="mr-2 h-4 w-4" />
              Dark
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("system")}>
              <Monitor className="mr-2 h-4 w-4" />
              System
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Active Account — with working switch */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center gap-2 h-9 px-2"
            >
              <Avatar
                src={activeAccount?.avatar_url}
                fallback={activeAccount?.display_name?.charAt(0) || "?"}
                className="h-7 w-7"
              />
              <span className="text-sm font-medium max-w-[120px] truncate">
                {activeAccount?.display_name || "No Account"}
              </span>
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel>Switch Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {accounts.length === 0 ? (
              <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                <p>No accounts yet</p>
                <Button
                  variant="link"
                  size="sm"
                  className="mt-1 h-auto p-0 text-xs"
                  onClick={() => navigate("/accounts")}
                >
                  Add your first account
                </Button>
              </div>
            ) : (
              accounts.map((account) => (
                <DropdownMenuItem
                  key={account.id}
                  onClick={() => handleSwitchAccount(account.id)}
                  className="flex items-center gap-3 py-2"
                >
                  <Avatar
                    src={account.avatar_url}
                    fallback={account.display_name.charAt(0)}
                    className="h-7 w-7"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {account.display_name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {account.username} · {account.provider}
                    </p>
                  </div>
                  {account.is_active && (
                    <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                  )}
                </DropdownMenuItem>
              ))
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/accounts")}>
              <Plus className="mr-2 h-4 w-4" />
              Manage Accounts
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
