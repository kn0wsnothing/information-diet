#!/usr/bin/env bash
set -euo pipefail
repo=/home/john/information-diet
mkdir -p "$HOME/.config/systemd/user"
install -m 0644 "$repo"/systemd/information-diet*.service "$repo"/systemd/information-diet*.timer "$HOME/.config/systemd/user/"
systemctl --user daemon-reload
systemctl --user enable --now information-diet.service information-diet-prepare.timer
echo "Web service and daily preparation for 06:00 HKT readiness enabled."
