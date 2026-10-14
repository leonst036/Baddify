package routes

import (
	"encoding/json"
	"net/http"
	"runtime"
	"sync"
	"sync/atomic"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/shirou/gopsutil/v4/cpu"
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

var (
	cachedCPU atomic.Pointer[CPUInfoResponse]
	startOnce sync.Once
)

func RegisterAboutServerRoutes(r chi.Router) {
	startCPUMonitor()
	r.Get("/api/cpu", AboutServerCPU)
	r.Get("/api/ram", AboutServerRAM)
}

func startCPUMonitor() {
	startOnce.Do(func() {
		logicalCores := runtime.NumCPU()
		physicalCores, err := cpu.Counts(false)
		if err != nil || physicalCores == 0 {
			physicalCores = logicalCores
		}

		// Initial seed value
		cachedCPU.Store(&CPUInfoResponse{
			LogicalCores:   logicalCores,
			PhysicalCores:  physicalCores,
			OverallPercent: []float64{0},
			UsagePercent:   0,
		})

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
