#!/usr/bin/env bash
set -e

# Change to project root directory
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_ROOT"

echo "=== Building Baddify AppImage ==="

BUILD_DIR="$PROJECT_ROOT/build"
APP_DIR="$BUILD_DIR/AppDir"
OUTPUT_DIR="$PROJECT_ROOT/dist"

# Ensure clean build directory
rm -rf "$APP_DIR"
mkdir -p "$BUILD_DIR" "$OUTPUT_DIR"
mkdir -p "$APP_DIR/usr/bin"
mkdir -p "$APP_DIR/usr/share/baddify/web"
mkdir -p "$APP_DIR/usr/share/applications"
mkdir -p "$APP_DIR/usr/share/metainfo"
mkdir -p "$APP_DIR/usr/share/icons/hicolor/scalable/apps"
mkdir -p "$APP_DIR/usr/share/icons/hicolor/256x256/apps"

# 1. Check required tools
command -v node >/dev/null 2>&1 || { echo "Error: node is required but not installed." >&2; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "Error: npm is required but not installed." >&2; exit 1; }
command -v go >/dev/null 2>&1 || { echo "Error: go is required but not installed." >&2; exit 1; }

# Locate caddy binary
CADDY_BIN="$(command -v caddy || which caddy || echo "/home/leon/.local/bin/caddy")"
if [ ! -f "$CADDY_BIN" ]; then
  echo "Error: caddy binary not found." >&2
  exit 1
fi

# Locate or download appimagetool
APPIMAGETOOL="$BUILD_DIR/appimagetool"
if command -v appimagetool >/dev/null 2>&1; then
  APPIMAGETOOL="$(command -v appimagetool)"
elif [ ! -x "$APPIMAGETOOL" ]; then
  echo "Downloading appimagetool..."
  curl -fsSL -o "$APPIMAGETOOL" https://github.com/AppImage/AppImageKit/releases/download/continuous/appimagetool-x86_64.AppImage
  chmod +x "$APPIMAGETOOL"
fi

# 2. Build web frontend
echo "Building web frontend..."
npm --prefix "$PROJECT_ROOT/web" run build
cp -r "$PROJECT_ROOT/web/dist" "$APP_DIR/usr/share/baddify/web/"

# 3. Build Go server & admin tools (statically linked for maximum portability)
echo "Compiling Go binaries..."
CGO_ENABLED=0 go build -ldflags="-s -w" -o "$APP_DIR/usr/bin/baddify-server" "$PROJECT_ROOT/cmd/server"
CGO_ENABLED=0 go build -ldflags="-s -w" -o "$APP_DIR/usr/bin/baddify-create-user" "$PROJECT_ROOT/dev/create_user.go"

# 4. Copy Caddy and configuration
cp "$CADDY_BIN" "$APP_DIR/usr/bin/caddy"
chmod +x "$APP_DIR/usr/bin/caddy"
cp "$PROJECT_ROOT/Caddyfile" "$APP_DIR/usr/share/baddify/Caddyfile"

# 5. Generate icons and metadata
echo "Preparing desktop integration and icons..."
cp "$PROJECT_ROOT/web/public/favicon.svg" "$APP_DIR/baddify.svg"
cp "$PROJECT_ROOT/web/public/favicon.svg" "$APP_DIR/usr/share/icons/hicolor/scalable/apps/baddify.svg"

if command -v rsvg-convert >/dev/null 2>&1; then
  rsvg-convert -w 256 -h 256 "$PROJECT_ROOT/web/public/favicon.svg" -o "$APP_DIR/baddify.png"
elif command -v magick >/dev/null 2>&1; then
  magick "$PROJECT_ROOT/web/public/favicon.svg" -resize 256x256 "$APP_DIR/baddify.png"
elif command -v convert >/dev/null 2>&1; then
  convert "$PROJECT_ROOT/web/public/favicon.svg" -resize 256x256 "$APP_DIR/baddify.png"
fi

if [ -f "$APP_DIR/baddify.png" ]; then
  cp "$APP_DIR/baddify.png" "$APP_DIR/usr/share/icons/hicolor/256x256/apps/baddify.png"
  ln -sf baddify.png "$APP_DIR/.DirIcon"
fi

# 6. Create desktop file
cat <<'EOF' > "$APP_DIR/baddify.desktop"
[Desktop Entry]
Type=Application
Name=Baddify
GenericName=Cloud Deployment Platform
Comment=Self-hosted cloud deployment control plane
Exec=AppRun %u
Icon=baddify
Terminal=true
Categories=Development;
Keywords=cloud;docker;deploy;containers;caddy;coolify;
StartupNotify=true
EOF
cp "$APP_DIR/baddify.desktop" "$APP_DIR/usr/share/applications/baddify.desktop"

# 7. Create AppStream metainfo
cat <<'EOF' > "$APP_DIR/usr/share/metainfo/io.baddify.app.metainfo.xml"
<?xml version="1.0" encoding="UTF-8"?>
<component type="desktop-application">
  <id>io.baddify.app</id>
  <metadata_license>CC0-1.0</metadata_license>
  <project_license>PolyForm-Noncommercial-1.0.0</project_license>
  <name>Baddify</name>
  <summary>Self-hosted cloud deployment control plane</summary>
  <description>
    <p>Baddify is a self-hosted cloud platform and deployment control plane for managing edge functions, containers, and services.</p>
  </description>
  <launchable type="desktop-id">baddify.desktop</launchable>
  <url type="homepage">https://github.com/leonst036/Baddify</url>
  <provides>
    <binary>baddify-server</binary>
  </provides>
</component>
EOF

# 8. Create AppRun entrypoint
cat <<'EOF' > "$APP_DIR/AppRun"
#!/usr/bin/env bash
set -e

# Spawn terminal emulator if launched from GUI without interactive terminal
if [ -z "$BADDIFY_TERMINAL_SPAWNED" ] && [ ! -t 1 ] && { [ -n "$DISPLAY" ] || [ -n "$WAYLAND_DISPLAY" ]; }; then
  export BADDIFY_TERMINAL_SPAWNED=1
  for term in kitty alacritty foot konsole gnome-terminal xfce4-terminal xterm; do
    if command -v "$term" >/dev/null 2>&1; then
      case "$term" in
        kitty)
          exec kitty --title "Baddify" "$0" "$@"
          ;;
        alacritty)
          exec alacritty --title "Baddify" -e "$0" "$@"
          ;;
        *)
          exec "$term" -e "$0" "$@"
          ;;
      esac
    fi
  done
fi

# Resolve AppDir path
if [ -z "$APPDIR" ]; then
  APPDIR="$(cd "$(dirname "$0")" && pwd)"
fi
export APPDIR
export PATH="$APPDIR/usr/bin:$PATH"
export BADDIFY_WEB_DIR="$APPDIR/usr/share/baddify/web/dist"

OPEN_BROWSER=1
for arg in "$@"; do
  case "$arg" in
    --no-browser)
      OPEN_BROWSER=0
      ;;
    --help|-h)
      echo "Baddify AppImage"
      echo ""
      echo "Usage: $0 [options]"
      echo ""
      echo "Options:"
      echo "  --no-browser    Run Baddify without opening the default web browser"
      echo "  --help, -h      Display this help message"
      exit 0
      ;;
  esac
done

prompt_yes_no() {
  local title="$1"
  local msg="$2"
  if [ -t 0 ]; then
    read -r -p "$msg [y/N]: " answer
    case "$answer" in
      [yY][eE][sS]|[yY]) return 0 ;;
      *) return 1 ;;
    esac
  elif command -v zenity >/dev/null 2>&1; then
    zenity --question --title="$title" --text="$msg" --width=380
    return $?
  elif command -v kdialog >/dev/null 2>&1; then
    kdialog --title "$title" --yesno "$msg"
    return $?
  else
    return 1
  fi
}

show_error() {
  local title="$1"
  local msg="$2"
  echo "Error: $msg" >&2
  if [ ! -t 1 ]; then
    if command -v zenity >/dev/null 2>&1; then
      zenity --error --title="$title" --text="$msg" --width=380
    elif command -v kdialog >/dev/null 2>&1; then
      kdialog --title "$title" --error "$msg"
    fi
  fi
}

# Check Docker daemon status
if ! docker info >/dev/null 2>&1; then
  echo "Docker daemon is not running."
  if prompt_yes_no "Baddify - Docker Required" "Docker daemon is not running or accessible. Would you like to start it now?"; then
    if [ ! -t 0 ] && command -v pkexec >/dev/null 2>&1; then
      pkexec systemctl start docker || sudo systemctl start docker || true
    else
      sudo systemctl start docker || true
    fi
    sleep 2
  fi

  if ! docker info >/dev/null 2>&1; then
    show_error "Baddify Error" "Docker daemon is not running or accessible. Please ensure Docker is running and your user has appropriate permissions (e.g., docker group)."
    exit 1
  fi
fi

# Check MongoDB status
is_mongo_ready() {
  if command -v docker >/dev/null 2>&1 && docker ps --filter "name=^/mongodb$" --format '{{.Names}}' 2>/dev/null | grep -q "^mongodb$"; then
    if docker exec mongodb mongosh --eval "db.adminCommand('ping')" --quiet >/dev/null 2>&1; then
      return 0
    fi
  fi
  (exec 3<>/dev/tcp/127.0.0.1/27017) 2>/dev/null && exec 3>&- && return 0
  if command -v nc >/dev/null 2>&1; then
    nc -z 127.0.0.1 27017 2>/dev/null && return 0
  fi
  return 1
}

if ! is_mongo_ready; then
  echo "MongoDB is not reachable at 127.0.0.1:27017."
  MONGO_CONTAINER=$(docker ps -a --filter "name=^/mongodb$" --format '{{.Names}}' 2>/dev/null || true)
  if [ "$MONGO_CONTAINER" = "mongodb" ]; then
    echo "Starting existing 'mongodb' container..."
    docker start mongodb >/dev/null
  else
    echo "Creating and starting new 'mongodb' container..."
    docker run -d --name mongodb \
      -p 27017:27017 \
      -e MONGO_INITDB_ROOT_USERNAME=admin \
      -e MONGO_INITDB_ROOT_PASSWORD=password123 \
      -v baddify_mongo_data:/data/db \
      mongo:latest >/dev/null
  fi

  echo "Waiting for MongoDB to be ready..."
  for i in $(seq 1 30); do
    if is_mongo_ready; then
      echo "MongoDB is ready."
      break
    fi
    sleep 1
  done

  if ! is_mongo_ready; then
    show_error "Baddify Error" "Timed out waiting for MongoDB to start on port 27017."
    exit 1
  fi
fi

# Ensure default admin user exists
echo "Ensuring default admin user exists..."
"$APPDIR/usr/bin/baddify-create-user" -if-empty -u admin -p password123 >/dev/null 2>&1 || true

# Start Caddy reverse proxy if not already running
CADDY_STARTED=0
if ! (exec 3<>/dev/tcp/127.0.0.1/2019) 2>/dev/null; then
  echo "Starting Caddy reverse proxy..."
  "$APPDIR/usr/bin/caddy" start --config "$APPDIR/usr/share/baddify/Caddyfile" >/dev/null 2>&1 || true
  CADDY_STARTED=1
fi

cleanup() {
  echo ""
  echo "Stopping Baddify services..."
  trap - EXIT INT TERM
  if [ -n "$SERVER_PID" ]; then
    kill "$SERVER_PID" 2>/dev/null || true
    wait "$SERVER_PID" 2>/dev/null || true
  fi
  if [ "$CADDY_STARTED" -eq 1 ]; then
    "$APPDIR/usr/bin/caddy" stop --address 127.0.0.1:2019 >/dev/null 2>&1 || "$APPDIR/usr/bin/caddy" stop >/dev/null 2>&1 || true
  fi
  if [ -n "$BADDIFY_TERMINAL_SPAWNED" ]; then
    echo ""
    read -r -p "Press Enter to close..." 2>/dev/null || true
  fi
  exit 0
}
trap cleanup EXIT INT TERM

# Validate server binary exists
if [ ! -x "$APPDIR/usr/bin/baddify-server" ]; then
  show_error "Baddify Error" "Server executable missing at $APPDIR/usr/bin/baddify-server"
  exit 1
fi

# Start Baddify backend server
echo "Starting Baddify server..."
"$APPDIR/usr/bin/baddify-server" &
SERVER_PID=$!

sleep 0.3
if ! kill -0 "$SERVER_PID" 2>/dev/null; then
  show_error "Baddify Error" "Baddify server process exited prematurely."
  exit 1
fi

echo "Waiting for Baddify server on http://localhost:4000..."
READY=0
for i in $(seq 1 40); do
  if ! kill -0 "$SERVER_PID" 2>/dev/null; then
    echo "Error: Baddify server stopped unexpectedly." >&2
    exit 1
  fi
  if curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:4000/ 2>/dev/null | grep -q "200"; then
    READY=1
    break
  fi
  sleep 0.5
done

if [ "$READY" -ne 1 ]; then
  show_error "Baddify Error" "Timed out waiting for Baddify server on http://localhost:4000."
  exit 1
fi

echo ""
echo "==========================================="
echo "  Baddify is ready!"
echo "  Web UI: http://localhost:4000"
echo "  Default Login: admin / password123"
echo "==========================================="
echo ""

if [ "$OPEN_BROWSER" -eq 1 ] && command -v xdg-open >/dev/null 2>&1; then
  xdg-open "http://localhost:4000" >/dev/null 2>&1 &
fi

wait "$SERVER_PID" 2>/dev/null || wait
EOF

chmod +x "$APP_DIR/AppRun"
chmod +x "$APP_DIR/usr/bin/"*

# 9. Package AppImage using appimagetool
APPIMAGE_TARGET="$OUTPUT_DIR/Baddify-x86_64.AppImage"
echo "Packaging AppImage..."
ARCH=x86_64 "$APPIMAGETOOL" "$APP_DIR" "$APPIMAGE_TARGET"
chmod +x "$APPIMAGE_TARGET"

# Copy binary directly to project root for convenience
rm -f "$PROJECT_ROOT/Baddify-x86_64.AppImage"
cp -f "$APPIMAGE_TARGET" "$PROJECT_ROOT/Baddify-x86_64.AppImage"
chmod +x "$PROJECT_ROOT/Baddify-x86_64.AppImage"
sync

echo ""
echo "=== Build Complete ==="
echo "AppImage created successfully at:"
echo "  $APPIMAGE_TARGET"
echo "  $PROJECT_ROOT/Baddify-x86_64.AppImage"
