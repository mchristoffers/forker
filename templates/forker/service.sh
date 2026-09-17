#!/usr/bin/env bash
# Manage a systemd user timer that runs forker/update.sh once a day.
# usage: forker/service.sh install | uninstall | status | run
set -euo pipefail
cd "$(dirname "$0")/.."
source forker/config

repo_dir=$(pwd)
unit="forker-update-${FORK//\//-}"
unit_dir="${XDG_CONFIG_HOME:-$HOME/.config}/systemd/user"

install() {
  local tool
  for tool in gh git systemctl; do
    command -v "$tool" >/dev/null || { echo "service: $tool required" >&2; exit 1; }
  done

  mkdir -p "$unit_dir"
  # PATH is captured now so the service finds gh/git where this shell does.
  cat > "$unit_dir/$unit.service" <<EOF
[Unit]
Description=forker: merge latest $UPSTREAM release into $FORK
Wants=network-online.target
After=network-online.target

[Service]
Type=oneshot
WorkingDirectory=$repo_dir
Environment="PATH=$PATH"
ExecStart=$(command -v bash) "$repo_dir/forker/update.sh"
EOF
  cat > "$unit_dir/$unit.timer" <<EOF
[Unit]
Description=Daily forker update for $FORK

[Timer]
OnCalendar=daily
Persistent=true
RandomizedDelaySec=1h

[Install]
WantedBy=timers.target
EOF

  systemctl --user daemon-reload
  systemctl --user enable --now "$unit.timer"

  # Without lingering, user timers only run while the user is logged in.
  if [[ "$(loginctl show-user "$USER" -p Linger --value 2>/dev/null)" != "yes" ]]; then
    loginctl enable-linger "$USER" \
      || echo "service: could not enable lingering; run 'sudo loginctl enable-linger $USER' so it runs while logged out" >&2
  fi

  echo "service: installed $unit.timer"
  systemctl --user list-timers "$unit.timer" --no-pager
}

uninstall() {
  systemctl --user disable --now "$unit.timer" 2>/dev/null || true
  rm -f "$unit_dir/$unit.service" "$unit_dir/$unit.timer"
  systemctl --user daemon-reload
  echo "service: removed $unit"
}

status() {
  systemctl --user list-timers "$unit.timer" --no-pager
  journalctl --user -u "$unit.service" -n 20 --no-pager
}

case "${1:-}" in
  install) install ;;
  uninstall) uninstall ;;
  status) status ;;
  run) systemctl --user start "$unit.service" && status ;;
  *) echo "usage: forker/service.sh install | uninstall | status | run" >&2; exit 1 ;;
esac
