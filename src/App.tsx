import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Dashboard } from "@/pages/Dashboard";
import { Accounts } from "@/pages/Accounts";
import { Repositories } from "@/pages/Repositories";
import { Settings } from "@/pages/Settings";
import { About } from "@/pages/About";
import { useThemeStore } from "@/stores/theme-store";
import { useAccountStore } from "@/stores/account-store";
import { getAccounts } from "@/lib/tauri";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute
      retry: 1,
    },
  },
});

function AppContent() {
  const initTheme = useThemeStore((s) => s.initTheme);
  const { setAccounts, setActiveAccount, setLoading } = useAccountStore();

  // Load accounts from backend on startup
  useEffect(() => {
    initTheme();
    loadAccounts();
  }, [initTheme]);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      const accounts = await getAccounts();
      setAccounts(accounts);

      // Find and set the active account
      const active = accounts.find((a: any) => a.is_active);
      if (active) {
        setActiveAccount(active);
      }
    } catch (err) {
      console.error("Failed to load accounts:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/accounts" element={<Accounts />} />
        <Route path="/repositories" element={<Repositories />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/about" element={<About />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
