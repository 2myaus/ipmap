mod serializers;

use tauri::Emitter;
use std::sync::Mutex;

#[derive(Default)]
struct AppState{
  cap_device_name: String,
  cap_break_handle: Option<pcap::BreakLoop>,
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
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
    .manage(Mutex::new(AppState::default()))
    .invoke_handler(tauri::generate_handler![
      start_capture, stop_capture, set_capture_device, get_devices,
      domain_to_ips, ip_to_domain
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}

#[derive(Clone, serde::Serialize)]
struct PacketInfo {
  src: String,
  dst: String,
  timestamp: i64
}


// turn a pcap packet into an instance of PacketInfo
fn parse_packet(packet: pcap::Packet) -> Result<PacketInfo, String> {
  let net = match etherparse::PacketHeaders::from_ethernet_slice(packet.data) {
    Err(e) => {return Err(format!("couldn't parse packet: {}", e.to_string())); },
    Ok(value) => match value.net {
      Some(val) => val,
      _ => {return Err("no net header".to_string()); }
    }
  };

  match net{
    etherparse::NetHeaders::Ipv4(v4head, _) => Ok(PacketInfo{
      src: v4head.source
        .into_iter()
        .map(|num| num.to_string())
        .collect::<Vec<String>>()
        .join("."),
      dst: v4head.destination
        .into_iter()
        .map(|num| num.to_string())
        .collect::<Vec<String>>()
        .join("."),
      timestamp: packet.header.ts.tv_sec * 1000 + packet.header.ts.tv_usec / 1000,
    }),
    etherparse::NetHeaders::Ipv6(v6head, _) => Ok(PacketInfo{
      src: v6head.source_addr().to_string(),
      dst: v6head.destination_addr().to_string(),
      timestamp: packet.header.ts.tv_sec * 1000 + packet.header.ts.tv_usec / 1000,
    }),
    _ => Err("not an ip packet".to_string())
  }
}

#[tauri::command]
fn set_capture_device(name: String, state: tauri::State<'_, Mutex<AppState>>) -> Result<(), String>{
  let mut devices = match pcap::Device::list(){
      Err(e) => {return Err(format!("unable to get network device list: {}", e.to_string()).to_string());},
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

/*
 * return a list of network interfaces
*/
#[tauri::command]
fn get_devices() -> Result<Vec<serializers::DeviceInfo>, String>{
  Ok(match pcap::Device::list(){
      Err(e) => {return Err(format!("unable to get network device list: {}", e.to_string()).to_string());},
      Ok(val) => val
    }
    .into_iter()
    .map(|device| serializers::DeviceInfo(device))
    .collect()
    )
}

#[tauri::command]
fn start_capture(app: tauri::AppHandle, state: tauri::State<'_, Mutex<AppState>>) -> Result<(), String>{
  let mut data = match state.lock() {
    Err(_) => {return Err("mutex is locked or poisoned".to_string());}
    Ok(val) => val
  };

  let mut devices = match pcap::Device::list(){
      Err(e) => {return Err(format!("unable to get network device list: {}", e.to_string()).to_string());},
      Ok(val) => val
    }
    .into_iter();

  let device = match devices.find(|dev| dev.name == data.cap_device_name) {
    Some(val) => val,
    _ => {return Err("capture device cannot be found".to_string());}
  };

  let mut cap = match 
    match pcap::Capture::from_device(device) {
      Err(e) => {return Err(format!("unable to start capture on specified device: {}", e.to_string()).to_string());},
      Ok(val) => val
    }
    .immediate_mode(true)
    .open()
    {
      Err(e) => {return Err(format!("unable to open specified device: {}", e.to_string()).to_string());},
      Ok(val) => val
    };

  data.cap_break_handle = Some(cap.breakloop_handle());
  
  std::thread::spawn(move || {
    while let Ok(packet) = cap.next_packet() {
      if let Ok(val) = parse_packet(packet){
        app.emit("new_packet", val).unwrap();
      }
    }
  });

  Ok(())
}

#[tauri::command]
fn stop_capture(state: tauri::State<'_, Mutex<AppState>>) {
  let mut data = state.lock().unwrap_or_else(|e| {
    state.clear_poison();
    e.into_inner()
  });

  data.cap_break_handle.as_ref().unwrap().breakloop();
  data.cap_break_handle = None;
}

#[tauri::command]
fn domain_to_ips(domain: String) -> Result<Vec<std::net::IpAddr>, String>{
  match dns_lookup::lookup_host(&domain) {
    Err(e) => Err(format!("couldn't get IPs from domain: {}", e).to_string()),
    Ok(val) => Ok(val.collect())
  }
}

#[tauri::command]
fn ip_to_domain(ip: std::net::IpAddr) -> Result<String, String>{
  match dns_lookup::lookup_addr(&ip) {
    Err(e) => Err(format!("couldn't get domain from IP: {}", e).to_string()),
    Ok(val) => Ok(val)
  }
}
