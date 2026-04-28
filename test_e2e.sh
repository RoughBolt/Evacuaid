#!/bin/bash
# EvacuAid E2E API Smoke Test Script
# Run with: bash test_e2e.sh

BASE="http://localhost:4000"
PASS=0
FAIL=0

check() {
  local label="$1"
  local result="$2"
  local expected="$3"
  if echo "$result" | grep -q "$expected"; then
    echo "✅ $label"
    PASS=$((PASS+1))
  else
    echo "❌ $label"
    echo "   Got: $result"
    FAIL=$((FAIL+1))
  fi
}

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║     EvacuAid E2E API Smoke Tests          ║"
echo "╚══════════════════════════════════════════╝"
echo ""

# ── 1. Health Check ──────────────────────────────
HEALTH=$(curl -s "$BASE/health")
check "API Health Check" "$HEALTH" '"status":"ok"'

# ── 2. Guest Login ───────────────────────────────
GUEST_RESP=$(curl -s -X POST "$BASE/auth/guest-login" \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice Smith","roomNumber":"204"}')
check "Guest Login" "$GUEST_RESP" '"success":true'

GUEST_TOKEN=$(echo "$GUEST_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['accessToken'])" 2>/dev/null)

# ── 3. Staff Login ───────────────────────────────
STAFF_RESP=$(curl -s -X POST "$BASE/auth/staff-login" \
  -H "Content-Type: application/json" \
  -d '{"employeeId":"EMP001","password":"hotel123"}')
check "Staff Login" "$STAFF_RESP" '"success":true'

STAFF_TOKEN=$(echo "$STAFF_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['accessToken'])" 2>/dev/null)

# ── 4. Get Zones ─────────────────────────────────
ZONES=$(curl -s "$BASE/zones" -H "Authorization: Bearer $GUEST_TOKEN")
check "Get Hotel Zones (12 expected)" "$ZONES" '"success":true'
ZONE_COUNT=$(echo "$ZONES" | python3 -c "import sys,json; print(len(json.load(sys.stdin)['data']))" 2>/dev/null)
echo "   → $ZONE_COUNT zones loaded"

# ── 5. Create FIRE Incident ──────────────────────
INC_RESP=$(curl -s -X POST "$BASE/incidents" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $GUEST_TOKEN" \
  -d '{"type":"FIRE","location":"Room 204","floor":2}')
check "Create FIRE Incident (SOS)" "$INC_RESP" '"severity":"CRITICAL"'

INCIDENT_ID=$(echo "$INC_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['id'])" 2>/dev/null)
echo "   → Incident ID: $INCIDENT_ID"

# ── 6. Get Escape Guidance ───────────────────────
GUIDANCE=$(curl -s "$BASE/incidents/$INCIDENT_ID/guidance" \
  -H "Authorization: Bearer $GUEST_TOKEN")
check "Get Escape Guidance" "$GUIDANCE" '"nearestExit"'
check "Guidance has steps" "$GUIDANCE" '"steps"'
check "Guidance has zones to avoid" "$GUIDANCE" '"zonesToAvoid"'

# ── 7. Staff Lists Incidents ──────────────────────
LIST=$(curl -s "$BASE/incidents" -H "Authorization: Bearer $STAFF_TOKEN")
check "Staff Can List Incidents" "$LIST" '"success":true'

# ── 8. Guest Cannot List All Incidents (role check) ──
GUEST_LIST=$(curl -s "$BASE/incidents/$INCIDENT_ID" -H "Authorization: Bearer $GUEST_TOKEN")
check "Guest Can Get Own Incident" "$GUEST_LIST" '"success":true'

# ── 9. Assign Responder ───────────────────────────
ASSIGN=$(curl -s -X POST "$BASE/incidents/$INCIDENT_ID/assign" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $STAFF_TOKEN")
check "Assign Responder" "$ASSIGN" '"success":true'

# ── 10. Broadcast Alert ───────────────────────────
BROADCAST=$(curl -s -X POST "$BASE/incidents/$INCIDENT_ID/broadcast" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $STAFF_TOKEN" \
  -d '{"message":"Evacuate via Exit B — all clear near stairwell"}')
check "Broadcast Staff Alert" "$BROADCAST" '"success":true'

# ── 11. Create MEDICAL Incident (Staff) ───────────
MED=$(curl -s -X POST "$BASE/incidents" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $STAFF_TOKEN" \
  -d '{"type":"MEDICAL","location":"Restaurant","floor":1}')
check "Staff Manual MEDICAL Incident" "$MED" '"severity":"HIGH"'
MED_ID=$(echo "$MED" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['id'])" 2>/dev/null)

# ── 12. Resolve FIRE Incident ─────────────────────
RESOLVE=$(curl -s -X PATCH "$BASE/incidents/$INCIDENT_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $STAFF_TOKEN" \
  -d '{"status":"RESOLVED"}')
check "Resolve Incident" "$RESOLVE" '"success":true'

# ── 13. Get Incident Report ───────────────────────
sleep 1
REPORT=$(curl -s "$BASE/incidents/$INCIDENT_ID/report" \
  -H "Authorization: Bearer $STAFF_TOKEN")
check "Get Incident Report" "$REPORT" '"incidentId"'
check "Report has timeline" "$REPORT" '"timeline"'

# ── Summary ───────────────────────────────────────
echo ""
echo "══════════════════════════════════════════"
echo "  Results: $PASS passed  |  $FAIL failed"
if [ $FAIL -eq 0 ]; then
  echo "  🚨 ALL TESTS PASSED — EvacuAid Backend ✅"
else
  echo "  ⚠️  Some tests failed — check output above"
fi
echo "══════════════════════════════════════════"
echo ""
