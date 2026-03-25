# Title

I built a CLI tool with Claude Code to switch between Claude Max accounts when you hit the usage cap

---

# Body

You know that moment when you're mid-refactor, Claude is on a roll, and then rate limit. Usage cap. Done for the next few hours.

I have two Max accounts for exactly this reason, but switching between them was annoying. Log out, open browser, log back in, wait for auth to complete. Killed the flow every time.

So I used Claude Code to build a fix. Kind of ironic that the tool hitting my limits helped me build the workaround. The whole thing is about 250 lines of bash, written and shipped in one Claude Code session.

**claude-switch** saves and restores Claude Code credentials from your macOS Keychain. When account A hits the cap, you switch to account B in one command. No re-auth through the browser.

Under the hood it just reads/writes the auth tokens Claude Code stores in the system Keychain. Nothing clever, just the same credential swap you'd do manually.

```bash
# First-time setup: save both accounts
claude-switch save work
claude-switch save personal

# Mid-session, when you hit the cap:
claude-switch use personal
```

That's the whole thing. It also lists saved accounts and has zsh completions.

Free, open source (MIT), 250 lines of bash. Install instructions in the repo README.

GitHub: https://github.com/malakhov-dmitrii/claude-switch

Curious if others have run into the same problem. Feedback welcome, especially if it breaks on your setup since I've only tested it on my machine so far.
