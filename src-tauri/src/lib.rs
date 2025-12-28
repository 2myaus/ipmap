#[derive(Default)]
struct AppState{
  cap_device_name: String,
  cap_break_handle: Option<pcap::BreakLoop>,
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  // Pcap setup

  tauri::Builder::default()
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .manage(std::sync::Mutex::new(AppState::default()))
    .invoke_handler(tauri::generate_handler![
      start_capture, stop_capture, set_capture_device
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}

struct PacketInfo {
  src: String,
  dst: String,
  timestamp: libc::timeval
}

fn got_packet(packet: &pcap::Packet) {
  match etherparse::SlicedPacket::from_ethernet(&packet.data){
    Err(value) => println!("Err {:?}", value),
    Ok(value) => {
         println!("link: {:?}", value.link);
         println!("link_exts: {:?}", value.link_exts); // vlan & macsec
         println!("net: {:?}", value.net); // ip & arp
         println!("transport: {:?}", value.transport);
     }
  }
}

#[tauri::command]
fn set_capture_device(name: String, state: tauri::State<'_, std::sync::Mutex<AppState>>) -> Result<(), String>{

  let mut devices = match pcap::Device::list(){
      Err(_) => {return Err("unable to get network device list".to_string());},
      Ok(val) => val
    }
    .into_iter();

  if devices.find(|dev| dev.name == name).is_none() {
    return Err("capture device cannot be found".to_string());
  }

  let mut data = match state.lock() {
    Err(_) => {return Err("mutex is locked or poisoned".to_string());}
    Ok(val) => val
  };
  data.cap_device_name = name;

  Ok(())
}

#[tauri::command]
fn start_capture(state: tauri::State<'_, std::sync::Mutex<AppState>>) -> Result<(), String>{
  let mut data = match state.lock() {
    Err(_) => {return Err("mutex is locked or poisoned".to_string());}
    Ok(val) => val
  };

  let mut devices = match pcap::Device::list(){
      Err(_) => {return Err("unable to get network device list".to_string());},
      Ok(val) => val
    }
    .into_iter();

  let device = match devices.find(|dev| dev.name == data.cap_device_name) {
    None => {return Err("capture device cannot be found".to_string());},
    Some(val) => val
  };

  let mut cap = match 
    match pcap::Capture::from_device(device) {
      Err(_) => {return Err("unable to start capture on specified device".to_string());},
      Ok(val) => val
    }
    .immediate_mode(true)
    .open()
    {
      Err(_) => {return Err("unable to open specified device".to_string());},
      Ok(val) => val
    };

  data.cap_break_handle = Some(cap.breakloop_handle());
  
  std::thread::spawn(move || {
      while let Ok(packet) = cap.next_packet() {
        println!("got packet! {packet:?}");
        got_packet(&packet);
      }
    });
  println!("Capture started!");

  Ok(());
}

#[tauri::command]
fn stop_capture(state: tauri::State<'_, std::sync::Mutex<AppState>>) {
  let mut data = state.lock().unwrap_or_else(|e| {
    state.clear_poison();
    e.into_inner()
  });

  data.cap_break_handle.as_ref().unwrap().breakloop();
  data.cap_break_handle = None;
}
