#!/usr/bin/env bash
# claude-switch installer
# curl -fsSL https://raw.githubusercontent.com/malakhov-dmitrii/claude-switch/main/install.sh | bash

set -euo pipefail

REPO="malakhov-dmitrii/claude-switch"
INSTALL_DIR="$HOME/.claude"
BIN_NAME="claude-switch"
TARGET="$INSTALL_DIR/$BIN_NAME"

info() { printf '\033[32m>>>\033[0m %s\n' "$*"; }
die()  { printf '\033[31merror:\033[0m %s\n' "$*" >&2; exit 1; }

# Sanity checks
command -v curl >/dev/null 2>&1 || die "curl is required"
command -v security >/dev/null 2>&1 || die "macOS Keychain (security) is required — this tool is macOS-only"
[[ -d "$INSTALL_DIR" ]] || die "~/.claude/ not found — is Claude Code installed?"

info "downloading claude-switch..."
curl -fsSL "https://raw.githubusercontent.com/$REPO/main/claude-switch" -o "$TARGET"
chmod +x "$TARGET"

# Add alias to shell rc (idempotent)
add_alias() {
  local rc="$1"
  if [[ -f "$rc" ]] && grep -q "claude-switch" "$rc" 2>/dev/null; then
    return 0
  fi
  if [[ -f "$rc" ]] || [[ "$rc" = "$HOME/.zshrc" ]]; then
    printf '\n# Claude Code account switcher\nalias claude-switch="%s"\n' "$TARGET" >> "$rc"
    info "added alias to $(basename "$rc")"
  fi
}

# Detect shell
case "${SHELL:-/bin/zsh}" in
  */zsh)  add_alias "$HOME/.zshrc" ;;
  */bash)
    if [[ -f "$HOME/.bash_profile" ]]; then
      add_alias "$HOME/.bash_profile"
    else
      add_alias "$HOME/.bashrc"
    fi
    ;;
  */fish)
    fish_dir="$HOME/.config/fish/conf.d"
    mkdir -p "$fish_dir"
    if ! grep -q "claude-switch" "$fish_dir/claude-switch.fish" 2>/dev/null; then
      echo "alias claude-switch=\"$TARGET\"" > "$fish_dir/claude-switch.fish"
      info "added alias to fish config"
    fi
    ;;
esac

info "installed to $TARGET"
echo ""
echo "  Restart your shell, then run:"
echo "    claude-switch --help"
echo ""
