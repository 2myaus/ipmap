fn main() {
  tauri_build::build();

  println!("");
  println!("Setting binary capabilities (requires sudo):");
  std::process::Command::new("sudo")
    .args([
      "setcap",
      "cap_net_raw,cap_net_admin=eip",
      "target/debug/app"
    ])
    .status()
    .expect("Failed to set binary capabilities");
  println!("");
}
