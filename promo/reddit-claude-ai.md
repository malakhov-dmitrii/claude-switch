# Title

Built a tiny tool to switch between Claude Max accounts in 1 second when you hit the usage cap

---

# Body

You know that moment when you're mid-refactor, Claude is on a roll, and then — rate limit. Usage cap. Done for the next few hours.

I have two Max accounts for exactly this reason, but switching between them was annoying: log out, open browser, log back in, wait for auth to complete. Killed the flow every time.

So I built a thing.

**claude-switch** is a tiny bash CLI that saves and restores Claude Code credentials in your macOS Keychain. That's basically it. When account A hits the cap, you switch to account B in one command — no browser, no re-auth, no context loss.

It works by reading/writing the auth tokens Claude Code stores in the system Keychain, so there's nothing clever happening under the hood. Just credential management you'd do manually, automated.

```bash
# First-time setup: save both accounts
claude-switch save work
claude-switch save personal

# Mid-session, when you hit the cap:
claude-switch use personal
```

That's the whole API. It also lists saved accounts and has shell completions if you want them.

Repo: https://github.com/malakhov-dmitrii/claude-switch

One-liner install:
```bash
curl -fsSL https://raw.githubusercontent.com/malakhov-dmitrii/claude-switch/main/install.sh | bash
```

Curious if others have run into the same friction. Feedback welcome — especially if it breaks on your setup, since I've only tested it on my machine so far.
