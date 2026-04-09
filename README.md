# claude-switch

Switch between Claude Code subscription accounts and configuration profiles in seconds.

If you have multiple Claude Max subscriptions (e.g. personal + work), `claude-switch` lets you swap between them without re-authenticating through the browser every time. You can also snapshot and restore your entire Claude Code configuration — settings, hooks, plugins, commands, skills, and more.

[![CI](https://github.com/malakhov-dmitrii/claude-switch/actions/workflows/ci.yml/badge.svg)](https://github.com/malakhov-dmitrii/claude-switch/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

<p align="center">
  <img src="demo.gif" alt="claude-switch demo" width="600">
</p>

## Why?

Claude Code's Max subscription has usage limits that reset periodically. If you hit the cap on one account, you can switch to another and keep working. Without this tool, switching means logging out, re-authenticating through the browser, and hoping you remember which account is which. `claude-switch` makes it a one-liner.

Beyond accounts, if you experiment with different Claude Code setups — different hooks, plugins, MCP servers — `claude-switch profile` lets you save and restore complete configurations without fear of losing your working setup.

## Install

Requires [Bun](https://bun.sh/). Supports macOS, Linux, and Windows.

**macOS / Linux:**

```bash
curl -fsSL https://raw.githubusercontent.com/malakhov-dmitrii/claude-switch/main/install.sh | bash
```

Or manually:

```bash
git clone https://github.com/malakhov-dmitrii/claude-switch.git ~/.claude/claude-switch
cd ~/.claude/claude-switch && bun install

# Add an alias
echo 'alias claude-switch="bun run $HOME/.claude/claude-switch/src/index.ts"' >> ~/.zshrc
```

**Linux note** — credentials are read from `~/.claude/.credentials.json` (where Claude Code stores them). No extra dependencies needed. To use the system keyring (libsecret) instead:
```bash
sudo apt install libsecret-tools  # Debian/Ubuntu
export CLAUDE_SWITCH_KEYCHAIN_BACKEND=secret-tool
```

**Windows** — manual install via PowerShell:
```powershell
git clone https://github.com/malakhov-dmitrii/claude-switch.git "$HOME\.claude\claude-switch"
cd "$HOME\.claude\claude-switch"; bun install

# Add a function to your PowerShell profile
Add-Content $PROFILE "`nfunction claude-switch { bun run `"$HOME\.claude\claude-switch\src\index.ts`" @args }"
```

Then restart your shell.

## Quick start

### Account switching

```bash
# 1. Save your current account
claude-switch save personal

# 2. Log in to your other account
claude auth logout && claude auth login

# 3. Save that one too
claude-switch save work

# 4. Switch anytime
claude-switch use work
claude-switch use personal
```

After switching, restart Claude Code to pick up the new credentials.

### Configuration profiles

```bash
# Save your entire Claude Code setup
claude-switch profile save work-setup

# Experiment freely with new plugins, hooks, etc.
# Then switch back when needed
claude-switch profile use work-setup

# Clone a profile to try variations safely
claude-switch profile clone work-setup experiment --only hooks,settings
```

## Usage

### Account commands

```
claude-switch                  # show current account (default)
claude-switch status           # same as above
claude-switch save <name>      # save current credentials as a profile
claude-switch use <name>       # switch to a saved profile
claude-switch list             # list all profiles (* = active)
claude-switch delete <name>    # delete a profile
claude-switch --help           # full help
claude-switch --version        # version info
```

### Profile commands

```
claude-switch profile save <name>                  # snapshot current config
claude-switch profile use <name>                   # restore a config (auto-saves current first)
claude-switch profile list                         # list all config profiles
claude-switch profile delete <name>                # delete a config profile
claude-switch profile show <name>                  # show profile details and sizes
claude-switch profile clone <src> <dst>            # clone with interactive picker
claude-switch profile clone <src> <dst> --all      # clone everything
claude-switch profile clone <src> <dst> --only X,Y # clone specific components
claude-switch profile bind <profile> <account>     # bind config profile to account
claude-switch profile unbind <profile>             # remove account binding
```

### What's included in a profile

| Component | What it covers |
|-----------|---------------|
| `settings` | `settings.json`, `settings.local.json` |
| `hooks` | `hooks/` directory |
| `plugins` | `plugins/` directory (excluding cache) |
| `commands` | `commands/` directory |
| `skills` | `skills/` directory |
| `md_files` | `*.md` files at `~/.claude/` root (CLAUDE.md, etc.) |
| `mcp` | `mcp.json` |

### Safety

Before switching profiles, `claude-switch` automatically saves your current config as a timestamped snapshot (e.g., `_auto_20260325_143000`). The 5 most recent snapshots are kept. You can restore any snapshot with `claude-switch profile use _auto_20260325_143000`.

### Account binding

You can bind a config profile to an account profile so switching configs also switches credentials:

```bash
claude-switch profile bind work-setup work
claude-switch profile use work-setup  # switches both config AND credentials
```

### Example output

```
$ claude-switch list
  personal         max / default_claude_max_20x *
  work             max / default_claude_max_20x

$ claude-switch use work
>>> switched to 'work'
    restart Claude Code to use the new credentials

work@example.com (max)
profile: work
```

## How it works

Claude Code stores OAuth credentials differently per platform:

- **macOS**: encrypted macOS Keychain, service `Claude Code-credentials`
- **Linux / Windows**: `~/.claude/.credentials.json` (or `$CLAUDE_CONFIG_DIR/.credentials.json`)

`claude-switch` saves and restores these credentials:

- **`save`** reads the current credentials and writes them to `~/.claude/profiles/<name>.json`
- **`use`** reads a saved profile and writes it back to the credential store
- Profiles are stored with `600` permissions (owner-read/write only; on Windows, permissions inherit from your user profile directory)

Configuration profiles are stored as directory snapshots under `~/.claude/config-profiles/<name>/`, each containing a `manifest.json` and copies of the relevant config files/directories.

No credentials are sent anywhere. Everything stays on your machine.

## Shell completions

### Zsh

```bash
# Copy the completion file
cp completions/_claude-switch /usr/local/share/zsh/site-functions/
# Or for Homebrew users:
cp completions/_claude-switch $(brew --prefix)/share/zsh/site-functions/
```

Then restart your shell. Tab-completion works for commands, profile names, and config profile names.

## Configuration

| Environment variable | Default | Description |
|---|---|---|
| `CLAUDE_SWITCH_DIR` | `~/.claude/profiles` | Where account profiles are stored |
| `CLAUDE_SWITCH_CONFIG_DIR` | `~/.claude/config-profiles` | Where config profiles are stored |
| `CLAUDE_SWITCH_KEYCHAIN_ACCOUNT` | `$(whoami)` | Keychain account name |
| `NO_COLOR` | *(unset)* | Disable colored output |

## Requirements

- macOS, Linux, or Windows
- [Bun](https://bun.sh/) runtime
- [Claude Code](https://docs.anthropic.com/en/docs/claude-code) CLI installed and authenticated

## FAQ

**Does this work on Linux?**
Yes. On Linux, credentials are read from `~/.claude/.credentials.json` (where Claude Code stores them). No extra dependencies needed. Set `CLAUDE_SWITCH_KEYCHAIN_BACKEND=secret-tool` to use libsecret instead.

**Does this work on Windows?**
Yes. On Windows, Claude Code stores credentials in `~/.claude/.credentials.json` and `claude-switch` reads/writes that file directly. File permissions rely on NTFS ACLs inherited from your user profile directory. Install Bun for Windows, then follow the PowerShell install instructions above.

**Is this safe?**
Your credentials never leave your machine. Profiles are stored with restricted file permissions (`600` on macOS/Linux; NTFS user-profile ACLs on Windows). On macOS, the tool reads/writes the Keychain entry that Claude Code itself uses — note that when writing credentials back, the token is briefly visible as a process argument (a limitation of the macOS `security` CLI). On Linux/Windows, credentials are read/written as a file with no process argument exposure.

**Do I need to re-authenticate after switching?**
No. Each profile stores the full OAuth tokens. Switching is instant — just restart Claude Code.

**What happens to my MCP server tokens (Slack, GitHub, etc.)?**
MCP OAuth tokens appear to be stored in the same Keychain entry as your Claude credentials. When you switch profiles, your MCP tokens likely switch too. You may need to re-auth MCP servers if you set them up on only one account.

**What about the `md_files` restore behavior?**
When you switch to a config profile, ALL `*.md` files in `~/.claude/` are replaced with the profile's snapshot. Files created after the profile was saved are removed — but they exist in the auto-snapshot taken before the switch. This is by design: a profile represents a complete configuration state.

## License

[MIT](LICENSE)
