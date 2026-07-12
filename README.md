# Git Account Manager

> **A cross-platform desktop app to manage multiple Git identities and accounts.**

Switch between Git accounts, manage credentials, and keep your Git workflows organized — all from one beautiful desktop app built with Rust + Tauri.

![Windows](https://img.shields.io/badge/Windows-supported-blue)
![macOS](https://img.shields.io/badge/macOS-supported-blue)
![Linux](https://img.shields.io/badge/Linux-supported-blue)
![Rust](https://img.shields.io/badge/Rust-1.77+-orange)
![License](https://img.shields.io/badge/license-MIT-green)

---

## ✨ Features

- **🔐 Account Management** — Add GitHub, GitLab, Bitbucket, or custom Git accounts with personal access tokens. Tokens are stored securely in your OS credential manager.
- **🔄 Quick Identity Switch** — Switch your global Git identity from the top bar or Accounts page. Sets `git config --global user.name` and `user.email` instantly.
- **📁 Repository Tracking** — Add local Git repositories via the native folder picker. See branch, uncommitted changes, and ahead/behind status at a glance.
- **🗑️ Delete with Options** — Remove repos from the app list, delete local folders, or even delete on GitHub/GitLab — all from one dialog.
- **🌗 Beautiful UI** — Dark / Light / System themes with a clean, modern design.
- **⚡ Fast & Lightweight** — Built with Rust + Tauri for minimal memory and CPU usage.
- **🛡️ OS-Native Security** — Secrets stored in Windows Credential Manager, macOS Keychain, or Linux Secret Service. Never stored in plaintext.

## 🖥️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, TypeScript, Vite, TailwindCSS, shadcn/ui |
| **Backend** | Rust, Tauri 2.0 |
| **Database** | SQLite (via rusqlite) |
| **Secrets** | OS-native keyring (keyring crate) |
| **State** | Zustand |
| **Routing** | React Router v7 |
| **Icons** | Lucide |

## 📋 Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| **Rust** | 1.77+ | [rustup.rs](https://rustup.rs) |
| **Node.js** | 18+ | [nodejs.org](https://nodejs.org) |
| **pnpm** | 8+ | `npm install -g pnpm` |
| **Git** | 2.x+ | [git-scm.com](https://git-scm.com) |

### Platform-specific requirements

**Windows 10/11:**
- WebView2 is built-in. No additional install needed.
- OpenSSH Client (optional, for SSH key features):  
  *Settings → Apps → Optional Features → Add a feature → OpenSSH Client*

**Linux (Ubuntu/Debian):**
```bash
sudo apt install libwebkit2gtk-4.1-dev libgtk-3-dev libayatana-appindicator3-dev librsvg2-dev
```

**macOS:**
- Xcode Command Line Tools: `xcode-select --install`

## 🚀 Getting Started

```bash
# 1. Clone the repository
git clone https://github.com/your-username/git-account-manager.git
cd git-account-manager

# 2. Install frontend dependencies
pnpm install

# 3. Run in development mode (hot reload)
pnpm tauri:dev

# 4. Build for production
pnpm tauri:build
```

The built installer/executable will be in `src-tauri/target/release/bundle/`.

### Portable build (no installer)

```bash
cargo tauri build --features portable
```

This produces a standalone executable. The "Start on Boot" setting is hidden in this mode.

## 📁 Project Structure

```
git-account-manager/
├── src/                        # Frontend (React + TypeScript)
│   ├── components/
│   │   ├── ui/                # shadcn/ui components
│   │   └── layout/            # Sidebar, TopBar, AppLayout
│   ├── pages/                  # Route pages
│   │   ├── Dashboard.tsx
│   │   ├── Accounts.tsx
│   │   ├── Repositories.tsx
│   │   ├── Settings.tsx
│   │   └── About.tsx
│   ├── stores/                 # Zustand state
│   ├── lib/                    # Tauri API wrapper + utilities
│   ├── types/                  # TypeScript definitions
├── src-tauri/                  # Backend (Rust)
│   ├── src/
│   │   ├── commands/           # Tauri command handlers
│   │   ├── accounts/           # Account service
│   │   ├── git/                # Git CLI integration
│   │   ├── repository/         # Repository management
│   │   ├── credential/         # OS keyring integration
│   │   ├── oauth/              # GitHub token verification
│   │   ├── database/           # SQLite + migrations
│   │   ├── settings/           # App settings
│   │   ├── models/             # Data models
│   │   ├── services/           # AppState & DI
│   │   └── errors/             # Error types
│   ├── Cargo.toml
│   └── tauri.conf.json
├── .gitignore
├── package.json
└── README.md
```

## 🗺️ Roadmap

- ✅ **Phase 1** — Project scaffold, Tauri + React integration
- ✅ **Phase 2** — Account CRUD, Git identity switching
- ✅ **Phase 3** — Repository tracking with git status
- ✅ **Phase 4** — Credential management (OS keyring)
- ✅ **Phase 5** — GitHub token verification
- 🔲 **Phase 6** — GitHub OAuth (Device Flow)
- 🔲 **Phase 7** — SSH key generation & management
- 🔲 **Phase 8** — Repository cloning from remote
- 🔲 **Phase 9** — Per-repo account configuration
- 🔲 **Phase 10** — Cross-platform packaging (MSI, DMG, AppImage)

## 🤝 How to Use

### Adding a GitHub Account
1. Create a **Personal Access Token** at [github.com/settings/tokens](https://github.com/settings/tokens) with `repo` and `user` scopes
2. Open the app → **Accounts** page → **Add Account**
3. Select **GitHub**, paste your token, click **Verify & Connect**
4. Your name, username, and email are auto-detected from the API

### Switching Accounts
- Click the account avatar in the **top-right corner** → select any account
- Or go to **Accounts** page → click **Set Active** on any account
- This updates `git config --global user.name` and `user.email` automatically

### Tracking Repositories
1. Go to **Repositories** page → **Add Folder**
2. Browse and select any Git repository folder
3. See the branch, changes status, and assign an account

## 🛡️ Security

- Tokens are **never** stored in the SQLite database — only a reference key is saved
- Actual secrets live in your **OS credential manager** (Windows Credential Manager, macOS Keychain, Linux Secret Service)
- The app never sends data to any external server except the Git provider APIs you explicitly authorize

## 📄 License

MIT License — see the [LICENSE](LICENSE) file.

## 🙏 Acknowledgments

- Built with [Tauri](https://tauri.app)
- UI components from [shadcn/ui](https://ui.shadcn.com)
- Icons from [Lucide](https://lucide.dev)
