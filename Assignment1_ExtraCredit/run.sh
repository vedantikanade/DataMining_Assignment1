# Create a local npm project (if none exists) and install a lightweight static server
if [ ! -f package.json ]; then
  npm init -y >/dev/null
fi
npm install --save-dev http-server >/dev/null

# Write the launch script
cat > run.sh <<'EOF'
#!/usr/bin/env bash
set -e

# Start the static server in the background (no caching, port 8080)
npx http-server -c-1 -p 8080 &
SERVER_PID=$!

# Open the default browser to the app
if command -v xdg-open >/dev/null; then
  xdg-open http://localhost:8080 &
elif command -v open >/dev/null; then
  open http://localhost:8080 &
fi

# Keep the script alive until the server stops
wait $SERVER_PID
EOF

# Make the script executable
chmod +x run.sh

# Run everything (install + serve) in parallel where appropriate
./run.sh
