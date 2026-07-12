import { create } from "zustand";
import type { GitAccount } from "@/types/account";

interface AccountState {
  accounts: GitAccount[];
  activeAccount: GitAccount | null;
  isLoading: boolean;
  setAccounts: (accounts: GitAccount[]) => void;
  setActiveAccount: (account: GitAccount | null) => void;
  setLoading: (loading: boolean) => void;
  addAccount: (account: GitAccount) => void;
  removeAccount: (id: string) => void;
  updateAccount: (id: string, updates: Partial<GitAccount>) => void;
}

export const useAccountStore = create<AccountState>((set) => ({
  accounts: [],
  activeAccount: null,
  isLoading: false,
  setAccounts: (accounts) => set({ accounts }),
  setActiveAccount: (account) => set({ activeAccount: account }),
  setLoading: (isLoading) => set({ isLoading }),
  addAccount: (account) =>
    set((state) => ({ accounts: [...state.accounts, account] })),
  removeAccount: (id) =>
    set((state) => ({
      accounts: state.accounts.filter((a) => a.id !== id),
      activeAccount:
        state.activeAccount?.id === id ? null : state.activeAccount,
    })),
  updateAccount: (id, updates) =>
    set((state) => ({
      accounts: state.accounts.map((a) =>
        a.id === id ? { ...a, ...updates } : a
      ),
      activeAccount:
        state.activeAccount?.id === id
          ? { ...state.activeAccount, ...updates }
          : state.activeAccount,
    })),
}));
