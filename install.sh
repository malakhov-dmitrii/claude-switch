#!/usr/bin/env bash
# claude-switch installer
# curl -fsSL https://raw.githubusercontent.com/malakhov-dmitrii/claude-switch/main/install.sh | bash

set -euo pipefail

REPO="malakhov-dmitrii/claude-switch"
INSTALL_DIR="$HOME/.claude/claude-switch"
WRAPPER="$HOME/.claude/claude-switch-bin"

info() { printf '\033[32m>>>\033[0m %s\n' "$*"; }
die()  { printf '\033[31merror:\033[0m %s\n' "$*" >&2; exit 1; }

# Sanity checks
command -v curl >/dev/null 2>&1 || die "curl is required"
command -v git >/dev/null 2>&1 || die "git is required"
command -v security >/dev/null 2>&1 || die "macOS Keychain (security) is required — this tool is macOS-only"
[[ -d "$HOME/.claude" ]] || die "~/.claude/ not found — is Claude Code installed?"

# Check for bun
if ! command -v bun >/dev/null 2>&1; then
  die "bun is required. Install it: curl -fsSL https://bun.sh/install | bash"
fi

info "installing claude-switch..."

# Clone or update
if [[ -d "$INSTALL_DIR" ]]; then
  info "updating existing installation..."
  cd "$INSTALL_DIR" && git pull --quiet
else
  git clone --quiet "https://github.com/$REPO.git" "$INSTALL_DIR"
fi

cd "$INSTALL_DIR"
info "installing dependencies..."
bun install --silent

# Create wrapper script
cat > "$WRAPPER" <<'WRAPPER_EOF'
#!/usr/bin/env bash
exec bun run "$HOME/.claude/claude-switch/src/index.ts" "$@"
WRAPPER_EOF
chmod +x "$WRAPPER"

# Add alias to shell rc (idempotent)
add_alias() {
  local rc="$1"
  if [[ -f "$rc" ]] && grep -q "claude-switch" "$rc" 2>/dev/null; then
    return 0
  fi
  if [[ -f "$rc" ]] || [[ "$rc" = "$HOME/.zshrc" ]]; then
    printf '\n# Claude Code account & profile switcher\nalias claude-switch="%s"\n' "$WRAPPER" >> "$rc"
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
      echo "alias claude-switch=\"$WRAPPER\"" > "$fish_dir/claude-switch.fish"
      info "added alias to fish config"
    fi
    ;;
esac

info "installed to $INSTALL_DIR"
echo ""
echo "  Restart your shell, then run:"
echo "    claude-switch --help"
echo ""
