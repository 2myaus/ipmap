# ipmap
listens to packets and draws a live graph of the hosts that your computer commmunicates with.  
this is a very early work-in-progress. if anything here is incorrect or could be improved, contributions are welcome.

this project uses Tauri for a Rust backend and HTML/CSS/JS frontend.  
current goals are:
- responsive graph i.e clicking on nodes shows their details
- an option to draw onto a world map with ip geolocation (probably using leaflet)

## building:
this software should work on all platform. as of writing, it has only been tested on linux.  
building/running will require [normal dependencies for a Tauri project](https://v2.tauri.app/start/prerequisites/). basically, Rust and Tauri itself.  
it uses bun and typescript for the frontend.  
additionally, it uses rust-pcap and requires [its dependencies](https://github.com/rust-pcap/pcap/#Building) (libpcap on linux or mac, npcap on windows).

to build/run, you can run ``cargo tauri build`` for a release build, or ``cargo tauri dev`` for developing.

pcap requires certain permissions to capture packets. the binary likely needs capabilities set (``sudo setcap cap_net_raw,cap_net_admin=eip BINARY``) to work properly.  
this is quite annoying, but i wrote a shell script for development (src-tauri/devrun.sh) that builds, sets capabilities, and runs the dev profile. it's basically my temporary replacement for ``cargo tauri dev``, which can't set capabilities automatically
