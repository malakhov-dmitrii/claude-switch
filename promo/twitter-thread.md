# Twitter/X Thread — claude-switch

---

**Tweet 1/5**

you're deep in a refactor, claude code hits its limit, and now you have to browser-auth into your second max account like it's 2012

i built a fix

🧵

---

**Tweet 2/5**

`claude-switch` — swap between Claude Code Max accounts in one command by swapping macOS Keychain credentials

```bash
claude-switch use work
# >>> switched to 'work'
#     restart Claude Code to use the new credentials
```

no browser. no re-auth. just keep coding.

---

**Tweet 3/5**

how it works:

Claude Code stores OAuth tokens in macOS Keychain under `Claude Code-credentials`

`claude-switch save <name>` snapshots that entry to `~/.claude/profiles/<name>.json`
`claude-switch use <name>` writes it back

credentials never leave your machine. profiles are `600`. that's it.

---

**Tweet 4/5**

install in one line:

```bash
curl -fsSL https://raw.githubusercontent.com/malakhov-dmitrii/claude-switch/main/install.sh | bash
```

then:
```bash
claude-switch save personal
claude-switch save work
claude-switch use work  # instant
```

→ https://github.com/malakhov-dmitrii/claude-switch

#ClaudeCode @AnthropicAI @alexalbert__

---

**Tweet 5/5**

macOS only for now — Claude Code stores creds differently on Linux

if you're on Linux and want to add support, PRs are very welcome

curious if others are running multiple Max accounts this way — what's your workflow?
