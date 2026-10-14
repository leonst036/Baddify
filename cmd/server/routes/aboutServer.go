package routes

import (
	"encoding/json"
	"fmt"
	"net/http"
	"runtime"
	"strings"
	"sync"
	"sync/atomic"
	"time"

	"baddify/pkg/docker"

	"github.com/go-chi/chi/v5"
	"github.com/shirou/gopsutil/v4/cpu"
	"github.com/shirou/gopsutil/v4/disk"
	"github.com/shirou/gopsutil/v4/host"
	"github.com/shirou/gopsutil/v4/load"
	"github.com/shirou/gopsutil/v4/mem"
)

type CPUInfoResponse struct {
	LogicalCores   int       `json:"logical_cores"`
	PhysicalCores  int       `json:"physical_cores"`
	OverallPercent []float64 `json:"overall_percent"`
	UsagePercent   float64   `json:"usage_percent"`
}

type RAMInfoResponse struct {
	Total       uint64  `json:"total"`
	Used        uint64  `json:"used"`
	Available   uint64  `json:"available"`
	Free        uint64  `json:"free"`
	UsedPercent float64 `json:"used_percent"`
}

type DiskIOResponse struct {
	ReadBytesPerSec  float64 `json:"read_bytes_per_sec"`
	WriteBytesPerSec float64 `json:"write_bytes_per_sec"`
	TotalReadBytes   uint64  `json:"total_read_bytes"`
	TotalWriteBytes  uint64  `json:"total_write_bytes"`
}

type InstancesInfoResponse struct {
	Running int `json:"running"`
	Total   int `json:"total"`
	Stopped int `json:"stopped"`
}

type NodeInfoResponse struct {
	Hostname        string  `json:"hostname"`
	OS              string  `json:"os"`
	Platform        string  `json:"platform"`
	PlatformVersion string  `json:"platform_version"`
	KernelVersion   string  `json:"kernel_version"`
	KernelArch      string  `json:"kernel_arch"`
	Uptime          uint64  `json:"uptime"`
	UptimeFormatted string  `json:"uptime_formatted"`
	CPUModel        string  `json:"cpu_model"`
	LogicalCores    int     `json:"logical_cores"`
	PhysicalCores   int     `json:"physical_cores"`
	TotalRAM        uint64  `json:"total_ram"`
	DockerVersion   string  `json:"docker_version"`
	DockerStatus    string  `json:"docker_status"`
	LoadAvg1        float64 `json:"load_avg_1"`
	LoadAvg5        float64 `json:"load_avg_5"`
	LoadAvg15       float64 `json:"load_avg_15"`
}

var (
	cachedCPU  atomic.Pointer[CPUInfoResponse]
	cachedDisk atomic.Pointer[DiskIOResponse]
	startOnce  sync.Once
)

func RegisterAboutServerRoutes(r chi.Router, dm *docker.Manager) {
	startSystemMonitor()
	r.Get("/api/cpu", AboutServerCPU)
	r.Get("/api/ram", AboutServerRAM)
	r.Get("/api/disk-io", AboutServerDiskIO)
	r.Get("/api/disk", AboutServerDiskIO)
	r.Get("/api/instances", AboutServerInstances(dm))
	r.Get("/api/node-info", AboutServerNodeInfo(dm))
	r.Get("/api/containers", AboutServerContainers(dm))
	r.Post("/api/containers/{id}/start", ContainerStart(dm))
	r.Post("/api/containers/{id}/stop", ContainerStop(dm))
	r.Post("/api/containers/{id}/restart", ContainerRestart(dm))
}

func startSystemMonitor() {
	startOnce.Do(func() {
		logicalCores := runtime.NumCPU()
		physicalCores, err := cpu.Counts(false)
		if err != nil || physicalCores == 0 {
			physicalCores = logicalCores
		}

		// Initial CPU seed
		cachedCPU.Store(&CPUInfoResponse{
			LogicalCores:   logicalCores,
			PhysicalCores:  physicalCores,
			OverallPercent: []float64{0},
			UsagePercent:   0,
		})

		// Initial Disk seed
		initRead, initWrite := getDiskIOBytes()
		cachedDisk.Store(&DiskIOResponse{
			ReadBytesPerSec:  0,
			WriteBytesPerSec: 0,
			TotalReadBytes:   initRead,
			TotalWriteBytes:  initWrite,
		})

		prevDiskRead := initRead
		prevDiskWrite := initWrite
		prevDiskTime := time.Now()

		// Background collector
		go func() {
			for {
				percents, err := cpu.Percent(time.Second, false)
				if err == nil && len(percents) > 0 {
					cachedCPU.Store(&CPUInfoResponse{
						LogicalCores:   logicalCores,
						PhysicalCores:  physicalCores,
						OverallPercent: percents,
						UsagePercent:   percents[0],
					})
				}

				curRead, curWrite := getDiskIOBytes()
				now := time.Now()
				delta := now.Sub(prevDiskTime).Seconds()
				var readRate, writeRate float64
				if delta > 0 {
					if curRead >= prevDiskRead {
						readRate = float64(curRead-prevDiskRead) / delta
					}
					if curWrite >= prevDiskWrite {
						writeRate = float64(curWrite-prevDiskWrite) / delta
					}
				}
				prevDiskRead = curRead
				prevDiskWrite = curWrite
				prevDiskTime = now

				cachedDisk.Store(&DiskIOResponse{
					ReadBytesPerSec:  readRate,
					WriteBytesPerSec: writeRate,
					TotalReadBytes:   curRead,
					TotalWriteBytes:  curWrite,
				})

				time.Sleep(1 * time.Second)
			}
		}()
	})
}

func AboutServerCPU(w http.ResponseWriter, r *http.Request) {
	data := cachedCPU.Load()
	if data == nil {
		http.Error(w, "CPU metrics not ready", http.StatusServiceUnavailable)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(data); err != nil {
		http.Error(w, "Error encoding response", http.StatusInternalServerError)
		return
	}
}

func AboutServerRAM(w http.ResponseWriter, r *http.Request) {
	v, err := mem.VirtualMemory()
	if err != nil {
		http.Error(w, "Error getting RAM info", http.StatusInternalServerError)
		return
	}

	res := RAMInfoResponse{
		Total:       v.Total,
		Used:        v.Used,
		Available:   v.Available,
		Free:        v.Free,
		UsedPercent: v.UsedPercent,
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(res); err != nil {
		http.Error(w, "Error encoding response", http.StatusInternalServerError)
		return
	}
}

func AboutServerDiskIO(w http.ResponseWriter, r *http.Request) {
	data := cachedDisk.Load()
	if data == nil {
		http.Error(w, "Disk metrics not ready", http.StatusServiceUnavailable)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(data); err != nil {
		http.Error(w, "Error encoding response", http.StatusInternalServerError)
		return
	}
}

func AboutServerInstances(dm *docker.Manager) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if dm == nil {
			http.Error(w, "Docker manager not configured", http.StatusServiceUnavailable)
			return
		}

		running, total, err := dm.GetContainerCounts(r.Context())
		if err != nil {
			http.Error(w, "Error getting container info: "+err.Error(), http.StatusInternalServerError)
			return
		}

		res := InstancesInfoResponse{
			Running: running,
			Total:   total,
			Stopped: total - running,
		}

		w.Header().Set("Content-Type", "application/json")
		if err := json.NewEncoder(w).Encode(res); err != nil {
			http.Error(w, "Error encoding response", http.StatusInternalServerError)
			return
		}
	}
}

func getDiskIOBytes() (read uint64, write uint64) {
	counters, err := disk.IOCounters()
	if err != nil {
		return 0, 0
	}
	for name, stat := range counters {
		if isDiskPartition(name, counters) {
			continue
		}
		read += stat.ReadBytes
		write += stat.WriteBytes
	}
	return read, write
}

func isDiskPartition(name string, all map[string]disk.IOCountersStat) bool {
	if strings.HasPrefix(name, "loop") || strings.HasPrefix(name, "zram") {
		return true
	}
	if strings.Contains(name, "nvme") || strings.Contains(name, "mmcblk") {
		if idx := strings.LastIndex(name, "p"); idx != -1 {
			parent := name[:idx]
			if _, ok := all[parent]; ok {
				return true
			}
		}
	}
	trimmed := strings.TrimRight(name, "0123456789")
	if trimmed != name && trimmed != "" {
		if _, ok := all[trimmed]; ok {
			return true
		}
	}
	return false
}

func formatUptime(seconds uint64) string {
	days := seconds / 86400
	hours := (seconds % 86400) / 3600
	mins := (seconds % 3600) / 60
	if days > 0 {
		return fmt.Sprintf("%dd %dh %dm", days, hours, mins)
	}
	if hours > 0 {
		return fmt.Sprintf("%dh %dm", hours, mins)
	}
	return fmt.Sprintf("%dm", mins)
}

func AboutServerNodeInfo(dm *docker.Manager) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		hInfo, err := host.InfoWithContext(r.Context())
		hostname := ""
		platform := runtime.GOOS
		platformVer := ""
		kernelVer := ""
		kernelArch := runtime.GOARCH
		var uptime uint64
		if err == nil && hInfo != nil {
			hostname = hInfo.Hostname
			platform = hInfo.Platform
			platformVer = hInfo.PlatformVersion
			kernelVer = hInfo.KernelVersion
			kernelArch = hInfo.KernelArch
			uptime = hInfo.Uptime
		}

		cpuModel := ""
		cpus, err := cpu.InfoWithContext(r.Context())
		if err == nil && len(cpus) > 0 {
			cpuModel = cpus[0].ModelName
		}

		logicalCores := runtime.NumCPU()
		physicalCores, _ := cpu.Counts(false)
		if physicalCores == 0 {
			physicalCores = logicalCores
		}

		var totalRAM uint64
		v, err := mem.VirtualMemoryWithContext(r.Context())
		if err == nil && v != nil {
			totalRAM = v.Total
		}

		load1, load5, load15 := 0.0, 0.0, 0.0
		lAvg, err := load.AvgWithContext(r.Context())
		if err == nil && lAvg != nil {
			load1 = lAvg.Load1
			load5 = lAvg.Load5
			load15 = lAvg.Load15
		}

		dockerVer := "Not connected"
		dockerStatus := "Offline"
		if dm != nil {
			dInfo, err := dm.GetDockerInfo(r.Context())
			if err == nil && dInfo != nil {
				dockerVer = dInfo.Version
				dockerStatus = "Online"
			}
		}

		res := NodeInfoResponse{
			Hostname:        hostname,
			OS:              runtime.GOOS,
			Platform:        platform,
			PlatformVersion: platformVer,
			KernelVersion:   kernelVer,
			KernelArch:      kernelArch,
			Uptime:          uptime,
			UptimeFormatted: formatUptime(uptime),
			CPUModel:        cpuModel,
			LogicalCores:    logicalCores,
			PhysicalCores:   physicalCores,
			TotalRAM:        totalRAM,
			DockerVersion:   dockerVer,
			DockerStatus:    dockerStatus,
			LoadAvg1:        load1,
			LoadAvg5:        load5,
			LoadAvg15:       load15,
		}

		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(res)
	}
}

func AboutServerContainers(dm *docker.Manager) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if dm == nil {
			http.Error(w, "Docker manager not configured", http.StatusServiceUnavailable)
			return
		}

		containers, err := dm.GetContainers(r.Context())
		if err != nil {
			http.Error(w, "Failed to get containers: "+err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(containers)
	}
}

func ContainerStart(dm *docker.Manager) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if dm == nil {
			http.Error(w, "Docker manager not configured", http.StatusServiceUnavailable)
			return
		}
		id := chi.URLParam(r, "id")
		if err := dm.StartContainer(r.Context(), id); err != nil {
			http.Error(w, "Failed to start container: "+err.Error(), http.StatusInternalServerError)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]string{"status": "started", "id": id})
	}
}

func ContainerStop(dm *docker.Manager) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if dm == nil {
			http.Error(w, "Docker manager not configured", http.StatusServiceUnavailable)
			return
		}
		id := chi.URLParam(r, "id")
		if err := dm.StopContainer(r.Context(), id); err != nil {
			http.Error(w, "Failed to stop container: "+err.Error(), http.StatusInternalServerError)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]string{"status": "stopped", "id": id})
	}
}

func ContainerRestart(dm *docker.Manager) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if dm == nil {
			http.Error(w, "Docker manager not configured", http.StatusServiceUnavailable)
			return
		}
		id := chi.URLParam(r, "id")
		if err := dm.RestartContainer(r.Context(), id); err != nil {
			http.Error(w, "Failed to restart container: "+err.Error(), http.StatusInternalServerError)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]string{"status": "restarted", "id": id})
	}
}
