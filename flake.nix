{
  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs?ref=nixos-unstable";
  };

  outputs = {nixpkgs, ...}: let
    system = "x86_64-linux";
    pkgs = nixpkgs.legacyPackages.${system};
  in {
    devShells.${system}.default = pkgs.mkShell {
      nativeBuildInputs = [
        pkgs.pkg-config
        pkgs.gobject-introspection
        pkgs.cargo
        pkgs.cargo-tauri
        pkgs.rustc
        pkgs.rust-analyzer
        pkgs.vscode-langservers-extracted # vscode-html-language-server
        pkgs.typescript-language-server
      ];
      buildInputs = [
        pkgs.at-spi2-atk
        pkgs.atkmm
        pkgs.cairo
        pkgs.gdk-pixbuf
        pkgs.glib
        pkgs.gtk3
        pkgs.harfbuzz
        pkgs.librsvg
        pkgs.libsoup_3
        pkgs.webkitgtk_4_1
        pkgs.pango
        pkgs.openssl
        pkgs.libpcap
      ];

      GDK_BACKEND = "x11";
    };
    packages.${system}.default = pkgs.callPackage ./default.nix {};
  };
}
