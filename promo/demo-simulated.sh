#!/bin/bash
# Simulated demo output for recording — shows what claude-switch looks like in action
# Run this with: bash promo/demo-simulated.sh | vhs or use for screenshots

BOLD='\033[1m'
DIM='\033[2m'
GREEN='\033[32m'
YELLOW='\033[33m'
CYAN='\033[36m'
RESET='\033[0m'

slow_type() {
  local text="$1"
  for (( i=0; i<${#text}; i++ )); do
    printf '%s' "${text:$i:1}"
    sleep 0.04
  done
}

prompt() {
  printf '\n'
  printf "${BOLD}${GREEN}❯${RESET} "
  slow_type "$1"
  sleep 0.3
  printf '\n'
}

prompt "claude-switch"
printf "${BOLD}cskeleto@gmail.com${RESET} ${DIM}(max)${RESET}\n"
printf "${CYAN}profile:${RESET} personal\n"
sleep 1.5

prompt "claude-switch list"
printf "  ${BOLD}%-16s${RESET} ${DIM}%s${RESET}${GREEN} *${RESET}\n" "personal" "max / default_claude_max_20x"
printf "  ${BOLD}%-16s${RESET} ${DIM}%s${RESET}\n" "work" "max / default_claude_max_20x"
sleep 1.5

prompt "claude-switch use work"
printf "${GREEN}>>>${RESET} switched to '${BOLD}work${RESET}'\n"
printf "${DIM}restart Claude Code to use the new credentials${RESET}\n"
printf '\n'
printf "${BOLD}d.malakhov@company.com${RESET} ${DIM}(max)${RESET}\n"
printf "${CYAN}profile:${RESET} work\n"
sleep 1.5

prompt "claude-switch use personal"
printf "${GREEN}>>>${RESET} switched to '${BOLD}personal${RESET}'\n"
printf "${DIM}restart Claude Code to use the new credentials${RESET}\n"
printf '\n'
printf "${BOLD}cskeleto@gmail.com${RESET} ${DIM}(max)${RESET}\n"
printf "${CYAN}profile:${RESET} personal\n"
sleep 2

printf '\n'
