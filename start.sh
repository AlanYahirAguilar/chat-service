#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# start.sh  —  Levanta el backend (gateway + microservicios)
#              y los 5 microfrontends de Relay en una sola llamada.
#
# Uso:
#   ./start.sh          → arranca todo
#   ./start.sh backend  → solo el backend
#   ./start.sh front    → solo el frontend
#   ./start.sh stop     → mata todos los procesos
#   ./start.sh status   → muestra qué está corriendo
# ─────────────────────────────────────────────────────────────

set -euo pipefail
REPO="$(cd "$(dirname "$0")" && pwd)"
BACKEND_LOG="$REPO/.logs/backend.log"
FRONT_LOG="$REPO/.logs/frontend.log"
BACKEND_PID="$REPO/.logs/backend.pid"
FRONT_PID="$REPO/.logs/frontend.pid"

mkdir -p "$REPO/.logs"

# ── colores ──────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'
ok()   { echo -e "  ${GREEN}✓${NC}  $*"; }
info() { echo -e "  ${CYAN}→${NC}  $*"; }
warn() { echo -e "  ${YELLOW}⚠${NC}  $*"; }
err()  { echo -e "  ${RED}✗${NC}  $*"; }

# ── comprobaciones previas ────────────────────────────────────
check_prereqs() {
  # MySQL
  if ! /usr/local/mysql/bin/mysql -u root -p"$(grep ^DB_PASSWORD "$REPO/.env" | cut -d= -f2-)" \
       -e "SELECT 1" &>/dev/null 2>&1; then
    warn "MySQL no responde. Ábrelo desde System Preferences → MySQL."
    exit 1
  fi
  # Redis
  if ! redis-cli ping &>/dev/null 2>&1; then
    info "Redis apagado, arrancando…"
    brew services start redis &>/dev/null || redis-server --daemonize yes &>/dev/null
    sleep 2
  fi
}

# ── shared build (necesario si no existe dist/) ──────────────
build_shared() {
  if [ ! -f "$REPO/packages/shared/dist/index.js" ]; then
    info "Compilando @chat-monorepo/shared…"
    npm run build -w @chat-monorepo/shared --silent
    ok "@chat-monorepo/shared compilado"
  fi
}

# ── arrancar backend ─────────────────────────────────────────
start_backend() {
  if [ -f "$BACKEND_PID" ] && kill -0 "$(cat "$BACKEND_PID")" &>/dev/null 2>&1; then
    ok "Backend ya corriendo (PID $(cat "$BACKEND_PID"))"
    return
  fi
  info "Arrancando backend (gateway + 8 microservicios)…"
  cd "$REPO"
  nohup npm run dev > "$BACKEND_LOG" 2>&1 &
  echo $! > "$BACKEND_PID"

  # Esperar a que el gateway responda (máx 60 s)
  for i in $(seq 1 20); do
    sleep 3
    code=$(curl -s -o /dev/null -w '%{http_code}' http://localhost:4001/docs 2>/dev/null || true)
    if [ "$code" = "200" ]; then
      ok "Gateway listo en http://localhost:4001  (docs: http://localhost:4001/docs)"
      return
    fi
  done
  err "El gateway tardó demasiado. Revisa $BACKEND_LOG"
  exit 1
}

# ── arrancar frontend ─────────────────────────────────────────
start_frontend() {
  if [ -f "$FRONT_PID" ] && kill -0 "$(cat "$FRONT_PID")" &>/dev/null 2>&1; then
    ok "Frontend ya corriendo (PID $(cat "$FRONT_PID"))"
    return
  fi
  info "Arrancando 4 microfrontends…"
  cd "$REPO"
  nohup npm run web:dev > "$FRONT_LOG" 2>&1 &
  echo $! > "$FRONT_PID"

  for i in $(seq 1 20); do
    sleep 3
    code=$(curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/login 2>/dev/null || true)
    if [ "$code" = "200" ]; then
      ok "Frontend listo en http://localhost:3000"
      return
    fi
  done
  err "El frontend tardó demasiado. Revisa $FRONT_LOG"
  exit 1
}

# ── preflight de demo ─────────────────────────────────────────
# Valida de punta a punta lo que la presentación va a tocar y
# precalienta las rutas (Next dev compila bajo demanda).
preflight() {
  echo -e "\n${BOLD}Preflight de demo${NC}"
  local jar="/tmp/relay-demo-cookies.txt"
  local fail=0

  # 1) Login real contra el gateway (guarda cookie de sesión)
  local demo_email demo_pass
  demo_email="${DEMO_EMAIL:-sussasos82@gmail.com}"
  demo_pass="${DEMO_PASSWORD:-Password123}"
  local code
  code=$(curl -s -o /dev/null -w '%{http_code}' -c "$jar" \
    -H 'Content-Type: application/json' \
    -d "{\"email\":\"$demo_email\",\"password\":\"$demo_pass\"}" \
    http://localhost:4001/api/auth/login)
  if [ "$code" = "200" ] || [ "$code" = "201" ]; then
    ok "Login ($demo_email)"
  else
    err "Login falló (HTTP $code) — revisa credenciales/seed"; fail=1
  fi

  # 2) Contactos
  code=$(curl -s -o /dev/null -w '%{http_code}' -b "$jar" http://localhost:4001/api/contacts)
  [ "$code" = "200" ] && ok "GET /contacts" || { err "GET /contacts (HTTP $code)"; fail=1; }

  # 3) Estado de WhatsApp
  local wa
  wa=$(curl -s -b "$jar" http://localhost:4001/api/chat/whatsapp-status | grep -o '"status":"[a-z]*"' | cut -d'"' -f4)
  if [ "$wa" = "connected" ]; then
    ok "WhatsApp conectado"
  else
    warn "WhatsApp: ${wa:-sin respuesta} — vincúlalo ANTES de presentar (Redactar → Conectar WhatsApp)"
    fail=1
  fi

  # 4) Warmup de las 3 zonas (primer render compila en dev)
  for path in login dashboard contacts compose; do
    code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 60 "http://localhost:3000/$path")
    [ "$code" = "200" ] && ok "Warmup /$path" || { err "/$path (HTTP $code)"; fail=1; }
  done

  rm -f "$jar"
  echo ""
  if [ "$fail" = "0" ]; then
    echo -e "  ${GREEN}${BOLD}✅ DEMO LISTA — todo verificado${NC}\n"
  else
    echo -e "  ${RED}${BOLD}✗ Hay pendientes arriba: resuélvelos antes de presentar${NC}\n"
    return 1
  fi
}

# ── detener todo ──────────────────────────────────────────────
stop_all() {
  info "Deteniendo procesos…"
  for pidfile in "$BACKEND_PID" "$FRONT_PID"; do
    if [ -f "$pidfile" ]; then
      pid=$(cat "$pidfile")
      kill "$pid" &>/dev/null 2>&1 && ok "Detenido PID $pid" || true
      rm -f "$pidfile"
    fi
  done
  # Liberar puertos por si quedaron huérfanos
  for p in 4001 4002 4003 4004 4005 4006 4008 4011 3000 3001 3002 3003; do
    pid=$(lsof -ti tcp:$p 2>/dev/null || true)
    [ -n "$pid" ] && kill -9 $pid &>/dev/null 2>&1 || true
  done
  ok "Todo detenido"
}

# ── status ────────────────────────────────────────────────────
show_status() {
  echo -e "\n${BOLD}Estado del stack${NC}"
  # formato: "label:port" por par
  local pairs=(
    "Gateway:4001" "Auth:4003" "IA:4004" "User:4002"
    "Mail:4005" "Telegram:4006" "Redis-svc:4008" "WhatsApp:4011"
    "Shell:3000" "Dashboard:3001" "Contacts:3002" "Composer:3003"
  )
  for pair in "${pairs[@]}"; do
    local label="${pair%%:*}"
    local port="${pair##*:}"
    local code
    code=$(curl -s -o /dev/null -w '%{http_code}' "http://localhost:${port}/" 2>/dev/null || echo "000")
    if [ "$code" != "000" ]; then
      ok "$label :$port ($code)"
    else
      err "$label :$port (DOWN)"
    fi
  done
}

# ── entrada ───────────────────────────────────────────────────
CMD="${1:-all}"
echo -e "\n${BOLD}Relay — Chat Service${NC}\n"

case "$CMD" in
  stop)    stop_all ;;
  status)  show_status ;;
  check)   preflight ;;
  backend) check_prereqs; build_shared; start_backend ;;
  front)   start_frontend ;;
  demo)
    check_prereqs
    build_shared
    start_backend
    start_frontend
    preflight
    ;;
  all|*)
    check_prereqs
    build_shared
    start_backend
    start_frontend
    echo ""
    echo -e "  ${BOLD}🟢  Stack completo listo${NC}"
    echo -e "  App:    ${CYAN}http://localhost:3000${NC}"
    echo -e "  API:    ${CYAN}http://localhost:4001/api${NC}"
    echo -e "  Swagger:${CYAN}http://localhost:4001/docs${NC}"
    echo ""
    echo -e "  ${YELLOW}Login demo:${NC} sussasos82@gmail.com / Password123"
    echo ""
    ;;
esac
