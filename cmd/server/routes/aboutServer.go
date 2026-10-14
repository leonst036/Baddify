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
)

type CPUInfoResponse struct {
	LogicalCores   int       `json:"logical_cores"`
	PhysicalCores  int       `json:"physical_cores"`
	OverallPercent []float64 `json:"overall_percent"`
	UsagePercent   float64   `json:"usage_percent"`
}

var (
	cachedCPU atomic.Pointer[CPUInfoResponse]
	startOnce sync.Once
)

func RegisterAboutServerRoutes(r chi.Router) {
	startCPUMonitor()
	r.Get("/api/cpu", AboutServerCPU)
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
