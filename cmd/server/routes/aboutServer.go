package routes

import (
	"encoding/json"
	"net/http"
	"runtime"
	"strings"
	"sync"
	"sync/atomic"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/shirou/gopsutil/v4/cpu"
	"github.com/shirou/gopsutil/v4/disk"
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

var (
	cachedCPU  atomic.Pointer[CPUInfoResponse]
	cachedDisk atomic.Pointer[DiskIOResponse]
	startOnce  sync.Once
)

func RegisterAboutServerRoutes(r chi.Router) {
	startSystemMonitor()
	r.Get("/api/cpu", AboutServerCPU)
	r.Get("/api/ram", AboutServerRAM)
	r.Get("/api/disk-io", AboutServerDiskIO)
	r.Get("/api/disk", AboutServerDiskIO)
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
