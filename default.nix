{
  lib,
  stdenv,
  rustPlatform,
  pkg-config,
  wrapGAppsHook4,
  cargo-tauri,
  webkitgtk_4_1,
  openssl,
  libpcap,
}:
rustPlatform.buildRustPackage (finalAttrs: {
  # ...

  cargoHash = "...";

  nativeBuildInputs =
    [
      # Pull in our main hook
      cargo-tauri.hook

      # Make sure we can find our libraries
      pkg-config
    ]
    ++ lib.optionals stdenv.hostPlatform.isLinux [wrapGAppsHook4];

  buildInputs = lib.optionals stdenv.hostPlatform.isLinux [
    openssl
    webkitgtk_4_1
    libpcap
  ];

  # Set our Tauri source directory
  cargoRoot = "src-tauri";
  # And make sure we build there too
  buildAndTestSubdir = finalAttrs.cargoRoot;

  # ...
})
