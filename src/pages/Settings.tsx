import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useThemeStore } from "@/stores/theme-store";
import {
  Sun,
  Moon,
  Monitor,
  FolderOpen,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { getSettings, updateSettings, isPortable, type AppSettings } from "@/lib/tauri";

export function Settings() {
  const { theme, setTheme } = useThemeStore();
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [gitPath, setGitPath] = useState("");
  const [tray, setTray] = useState(true);
  const [startup, setStartup] = useState(false);
  const [isPortableBuild, setIsPortableBuild] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");

  useEffect(() => {
    loadSettings();
    checkPortable();
  }, []);

  const checkPortable = async () => {
    try {
      const portable = await isPortable();
      setIsPortableBuild(portable);
    } catch {
      setIsPortableBuild(false);
    }
  };

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const s = await getSettings();
      setSettings(s);
      setGitPath(s.git_path || "");
      setTray(s.minimize_to_tray);
      setStartup(s.start_on_boot);
    } catch (err) {
      console.error("Failed to load settings:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;
    setIsSaving(true);
    setSaveStatus("idle");
    try {
      await updateSettings({
        ...settings,
        git_path: gitPath || null,
        minimize_to_tray: tray,
        ...(isPortableBuild ? {} : { start_on_boot: startup }),
      });
      setSaveStatus("success");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch (err) {
      setSaveStatus("error");
      console.error("Failed to save settings:", err);
      setTimeout(() => setSaveStatus("idle"), 5000);
    } finally {
      setIsSaving(false);
    }
  };

  const themeOptions = [
    { value: "light" as const, label: "Light", icon: Sun },
    { value: "dark" as const, label: "Dark", icon: Moon },
    { value: "system" as const, label: "System", icon: Monitor },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">
          Configure your Git Account Manager preferences
        </p>
      </div>

      {saveStatus === "success" && (
        <div className="flex items-center gap-3 rounded-lg border border-emerald-500/50 bg-emerald-500/10 p-4 text-sm text-emerald-600 dark:text-emerald-400 animate-fade-in">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <span>Settings saved successfully</span>
        </div>
      )}
      {saveStatus === "error" && (
        <div className="flex items-center gap-3 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive animate-fade-in">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>Failed to save settings. Please try again.</span>
        </div>
      )}

      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Appearance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Theme</label>
            <p className="text-xs text-muted-foreground mb-3">
              Choose your preferred color scheme
            </p>
            <div className="flex gap-2">
              {themeOptions.map((option) => {
                const Icon = option.icon;
                const isActive = theme === option.value;
                return (
                  <Button
                    key={option.value}
                    variant={isActive ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTheme(option.value)}
                    className="flex-1"
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    {option.label}
                  </Button>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Git Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Git Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Git Path</label>
            <p className="text-xs text-muted-foreground mb-2">
              Path to Git executable (auto-detected if empty)
            </p>
            <div className="flex gap-2">
              <Input
                placeholder="C:\\Program Files\\Git\\bin\\git.exe"
                value={gitPath}
                onChange={(e) => setGitPath(e.target.value)}
                className="flex-1"
              />
              <Button variant="outline" size="icon" disabled>
                <FolderOpen className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Application Behavior */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Application Behavior</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            {
              id: "tray",
              label: "Minimize to System Tray",
              description:
                "Keep the app running in the background when closed",
              checked: tray,
              onChange: setTray,
            },
            ...(isPortableBuild
              ? []
              : [
                  {
                    id: "startup",
                    label: "Start on Boot",
                    description:
                      "Launch Git Account Manager when you start your computer",
                    checked: startup,
                    onChange: setStartup,
                  },
                ]),
          ].map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between py-2"
            >
              <div>
                <label
                  htmlFor={item.id}
                  className="text-sm font-medium cursor-pointer"
                >
                  {item.label}
                </label>
                <p className="text-xs text-muted-foreground">
                  {item.description}
                </p>
              </div>
              <Switch
                id={item.id}
                checked={item.checked}
                onCheckedChange={item.onChange}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          {isSaving ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </div>
  );
}
