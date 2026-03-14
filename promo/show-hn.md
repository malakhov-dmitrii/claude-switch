# Show HN Submission

## Title

Show HN: claude-switch – swap Claude Code Max accounts via macOS Keychain (~250 lines bash)

---

## Body

Claude Code stores OAuth credentials in the macOS Keychain under a fixed service name ("Claude Code-credentials"). If you have two Max subscriptions — say, personal and work — there's no built-in way to switch between them without a full logout/login cycle.

claude-switch solves this by snapshotting the Keychain entry for each account and restoring it on demand:

```
claude-switch save personal
claude auth logout && claude auth login   # log in to second account
claude-switch save work

claude-switch use work    # instant switch, restart Claude Code
claude-switch use personal
```

Credentials are written to `~/.claude/profiles/<name>.json` with `chmod 600`. The directory itself is `chmod 700`. No third-party deps — just `security(1)` and standard bash.

Limitations: macOS only (relies on the `security` CLI), stores OAuth tokens in plain JSON files on disk, requires a Claude Code restart after switching.

https://github.com/malakhov-dmitrii/claude-switch
