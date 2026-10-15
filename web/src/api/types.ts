export interface CPUInfoResponse {
  logical_cores: number
  physical_cores: number
  overall_percent: number[]
  usage_percent: number
}

export interface RAMInfoResponse {
  total: number
  used: number
  available: number
  free: number
  used_percent: number
}

export interface DiskIOResponse {
  read_bytes_per_sec: number
  write_bytes_per_sec: number
  total_read_bytes: number
  total_write_bytes: number
}

export interface InstancesInfoResponse {
  running: number
  total: number
  stopped: number
}

export interface ContainerPort {
  ip?: string
  private_port: number
  public_port?: number
  type: string
}

export interface ContainerItem {
  id: string
  short_id: string
  name: string
  image: string
  state: string
  status: string
  created: number
  ports: ContainerPort[]
}

export interface NodeInfoResponse {
  hostname: string
  os: string
  platform: string
  platform_version: string
  kernel_version: string
  kernel_arch: string
  uptime: number
  uptime_formatted: string
  cpu_model: string
  logical_cores: number
  physical_cores: number
  total_ram: number
  docker_version: string
  docker_status: string
  load_avg_1: number
  load_avg_5: number
  load_avg_15: number
}
