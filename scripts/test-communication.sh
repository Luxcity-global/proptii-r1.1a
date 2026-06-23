#!/usr/bin/env bash
# =============================================================================
# test-communication.sh
# Runs all Proptii communication tests sequentially:
#   1. Backend  — Jest  (api/)
#   2. Frontend — Vitest (root)
#
# Usage:
#   bash scripts/test-communication.sh
#   bash scripts/test-communication.sh --coverage   (adds coverage to both)
# =============================================================================

set -euo pipefail

COVERAGE=${1:-""}
PASS=0
FAIL=0
BACKEND_EXIT=0
FRONTEND_EXIT=0

# Colours
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
RESET='\033[0m'

divider() {
  echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
}

header() {
  divider
  echo -e "${BOLD}  $1${RESET}"
  divider
}

# =============================================================================
# 1. BACKEND — Jest
# =============================================================================
header "🔧  BACKEND TESTS  (api/ — Jest)"

BACKEND_PATTERN="communication|ConversationService|AttachmentService|NotificationService|conversationParticipantGuard|phoneNormaliser"

if [ "$COVERAGE" = "--coverage" ]; then
  BACKEND_CMD="npm test -- --verbose --coverage --testPathPattern=\"$BACKEND_PATTERN\""
else
  BACKEND_CMD="npm test -- --verbose --testPathPattern=\"$BACKEND_PATTERN\""
fi

echo -e "${YELLOW}▶  Running: $BACKEND_CMD${RESET}"
echo ""

# Run from api/ directory; capture exit code without stopping the script
set +e
(cd api && eval "$BACKEND_CMD")
BACKEND_EXIT=$?
set -e

if [ $BACKEND_EXIT -eq 0 ]; then
  echo -e "\n${GREEN}✅  Backend tests PASSED${RESET}"
  PASS=$((PASS + 1))
else
  echo -e "\n${RED}❌  Backend tests FAILED (exit $BACKEND_EXIT)${RESET}"
  FAIL=$((FAIL + 1))
fi

echo ""

# =============================================================================
# 2. FRONTEND — Vitest
# =============================================================================
header "🎨  FRONTEND TESTS  (root — Vitest)"

FRONTEND_PATTERN="communicationService|MessagingPoller|MessageThread|ComposeBox|ConversationListItem|DashboardSidebar|ListingCard"

if [ "$COVERAGE" = "--coverage" ]; then
  FRONTEND_CMD="npm run test -- --run --reporter=verbose --coverage \"$FRONTEND_PATTERN\""
else
  FRONTEND_CMD="npm run test -- --run --reporter=verbose \"$FRONTEND_PATTERN\""
fi

echo -e "${YELLOW}▶  Running: $FRONTEND_CMD${RESET}"
echo ""

set +e
eval "$FRONTEND_CMD"
FRONTEND_EXIT=$?
set -e

if [ $FRONTEND_EXIT -eq 0 ]; then
  echo -e "\n${GREEN}✅  Frontend tests PASSED${RESET}"
  PASS=$((PASS + 1))
else
  echo -e "\n${RED}❌  Frontend tests FAILED (exit $FRONTEND_EXIT)${RESET}"
  FAIL=$((FAIL + 1))
fi

# =============================================================================
# SUMMARY
# =============================================================================
echo ""
divider
echo -e "${BOLD}  SUMMARY${RESET}"
divider
echo -e "  Backend  : $([ $BACKEND_EXIT -eq 0 ]  && echo "${GREEN}PASSED${RESET}" || echo "${RED}FAILED${RESET}")"
echo -e "  Frontend : $([ $FRONTEND_EXIT -eq 0 ] && echo "${GREEN}PASSED${RESET}" || echo "${RED}FAILED${RESET}")"
echo ""
echo -e "  Suites passed : ${GREEN}$PASS${RESET}"
echo -e "  Suites failed : ${RED}$FAIL${RESET}"
divider

# Exit with failure if either suite failed
if [ $FAIL -gt 0 ]; then
  exit 1
fi

exit 0
