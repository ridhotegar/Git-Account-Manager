import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  FolderGit2,
  Settings,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard", end: true },
  { to: "/accounts", icon: Users, label: "Accounts" },
  { to: "/repositories", icon: FolderGit2, label: "Repositories" },
  { to: "/settings", icon: Settings, label: "Settings" },
  { to: "/about", icon: Info, label: "About" },
];

export function Sidebar() {
  return (
    <aside className="flex h-full w-56 flex-col border-r border-sidebar-border bg-sidebar">
      {/* Logo */}
      <div className="flex h-14 items-center gap-3 border-b border-sidebar-border px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">
          G
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-sidebar-foreground">
            Git Account
          </span>
          <span className="text-[11px] text-sidebar-foreground/60">
            Manager
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-3">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
              )
            }
          >
            <item.icon className="h-4 w-4 shrink-0" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border p-3">
        <div className="rounded-lg bg-sidebar-accent/50 px-3 py-2">
          <p className="text-[11px] text-sidebar-foreground/60">
            v0.1.0 · Using Git CLI
          </p>
        </div>
      </div>
    </aside>
  );
}
