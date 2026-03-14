# claude-switch

Switch between Claude Code subscription accounts in seconds.

If you have multiple Claude Max subscriptions (e.g. personal + work), `claude-switch` lets you swap between them without re-authenticating through the browser every time.

[![CI](https://github.com/malakhov-dmitrii/claude-switch/actions/workflows/ci.yml/badge.svg)](https://github.com/malakhov-dmitrii/claude-switch/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

## Why?

Claude Code's Max subscription has usage limits that reset periodically. If you hit the cap on one account, you can switch to another and keep working. Without this tool, switching means logging out, re-authenticating through the browser, and hoping you remember which account is which. `claude-switch` makes it a one-liner.

## Install

```bash
curl -fsSL https://raw.githubusercontent.com/malakhov-dmitrii/claude-switch/main/install.sh | bash
```

Or manually:

```bash
# Download the script
curl -fsSL https://raw.githubusercontent.com/malakhov-dmitrii/claude-switch/main/claude-switch \
  -o ~/.claude/claude-switch
chmod +x ~/.claude/claude-switch

# Add an alias (optional)
echo 'alias claude-switch="$HOME/.claude/claude-switch"' >> ~/.zshrc
```

## Quick start

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

## Usage

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

Claude Code stores OAuth credentials in the **macOS Keychain** under the service `Claude Code-credentials`. `claude-switch` saves and restores these credentials:

- **`save`** reads the current keychain entry and writes it to `~/.claude/profiles/<name>.json`
- **`use`** reads a saved profile and writes it back to the keychain
- Profiles are stored with `600` permissions (owner-read/write only)
- The profiles directory (`~/.claude/profiles/`) has `700` permissions

No credentials are sent anywhere. Everything stays on your machine.

## Shell completions

### Zsh

```bash
# Copy the completion file
cp completions/_claude-switch /usr/local/share/zsh/site-functions/
# Or for Homebrew users:
cp completions/_claude-switch $(brew --prefix)/share/zsh/site-functions/
```

Then restart your shell. Tab-completion works for commands and profile names.

## Configuration

| Environment variable | Default | Description |
|---|---|---|
| `CLAUDE_SWITCH_DIR` | `~/.claude/profiles` | Where profiles are stored |
| `CLAUDE_SWITCH_KEYCHAIN_ACCOUNT` | `$(whoami)` | Keychain account name |
| `NO_COLOR` | *(unset)* | Disable colored output |

## Requirements

- macOS (uses Keychain for credential storage)
- [Claude Code](https://docs.anthropic.com/en/docs/claude-code) CLI installed and authenticated
- `bash` 3.2+ (ships with macOS)

## FAQ

**Does this work on Linux?**
Not yet — Claude Code on Linux stores credentials differently. PRs welcome.

**Is this safe?**
Your credentials never leave your machine. Profiles are stored with restricted file permissions. The tool only reads/writes the macOS Keychain entry that Claude Code itself uses.

**Do I need to re-authenticate after switching?**
No. Each profile stores the full OAuth tokens. Switching is instant — just restart Claude Code.

**What happens to my MCP server tokens (Slack, GitHub, etc.)?**
MCP OAuth tokens are stored alongside your Claude credentials. When you switch profiles, your MCP tokens switch too. You may need to re-auth MCP servers if you set them up on only one account.

## License

[MIT](LICENSE)
