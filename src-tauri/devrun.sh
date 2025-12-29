#!/bin/sh

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )

cargo-tauri build -d --no-bundle
sudo setcap cap_net_raw,cap_net_admin=eip $SCRIPT_DIR/target/debug/ipmap
$SCRIPT_DIR/target/debug/ipmap
