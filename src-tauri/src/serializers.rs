use serde::ser::{SerializeStruct};

pub struct DeviceInfo(pub pcap::Device);
struct AddressInfo(pcap::Address);
struct DeviceFlagsInfo(pcap::DeviceFlags);

#[derive(serde::Serialize)]
struct IfFlagsInfo {
  loopback: bool,
  up: bool,
  running: bool,
  wireless: bool
}

impl serde::Serialize for DeviceFlagsInfo{
  fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
  where
    S: serde::Serializer,
  {
    let device_flags = &self.0;
    let mut device_flags_state = serializer.serialize_struct("DeviceFlags", 2)?;
    device_flags_state.serialize_field("if_flags", &IfFlagsInfo {
      loopback: device_flags.is_loopback(),
      up: device_flags.is_up(),
      running: device_flags.is_running(),
      wireless: device_flags.is_wireless()
    })?;
    device_flags_state.serialize_field("connection_status", &(device_flags.connection_status == pcap::ConnectionStatus::Connected))?;

    device_flags_state.end()
  }

}

impl serde::Serialize for AddressInfo {
  fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
  where
    S: serde::Serializer,
  {
    let address = &self.0;
    let mut address_state = serializer.serialize_struct("Address", 4)?;
    address_state.serialize_field("addr", &address.addr)?;
    address_state.serialize_field("netmask", &address.netmask)?;
    address_state.serialize_field("broadcast_addr", &address.broadcast_addr)?;
    address_state.serialize_field("dst_addr", &address.dst_addr)?;
    address_state.end()
  }
}

impl serde::Serialize for DeviceInfo {
  fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
  where
    S: serde::Serializer,
  {
    let dev = &self.0;
    let mut device_state = serializer.serialize_struct("Device", 4)?;

    device_state.serialize_field("name", &dev.name)?;
    device_state.serialize_field("desc", &dev.desc)?;
    let addresses: Vec<AddressInfo> = dev.addresses.iter().map(|addr| AddressInfo(addr.clone())).collect();
    device_state.serialize_field("addresses", &addresses)?;
    device_state.serialize_field("flags", &DeviceFlagsInfo(dev.flags.clone()))?;

    device_state.end()
  }
}
