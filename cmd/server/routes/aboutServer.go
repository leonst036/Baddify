package routes

import (
	"encoding/json"
	"net/http"
	"runtime"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/shirou/gopsutil/v4/cpu"
)

func RegisterAboutServerRoutes(r chi.Router) {
	r.Get("/api/cpu", AboutServerCPU)
}

type CPUInfoResponse struct {
	LogicalCores   int       `json:"logical_cores"`
	PhysicalCores  int       `json:"physical_cores"`
	OverallPercent []float64 `json:"overall_percent"`
	UsagePercent   float64   `json:"usage_percent"`
}

func AboutServerCPU(w http.ResponseWriter, r *http.Request) {
	logicalCores := runtime.NumCPU()
	physicalCores, err := cpu.Counts(false)
	if err != nil {
		http.Error(w, "Error getting CPU info", http.StatusInternalServerError)
		return
	}

	overallPercent, err := cpu.Percent(1*time.Second, false)
	if err != nil {
		http.Error(w, "Error getting CPU percent", http.StatusInternalServerError)
		return
	}

	var usage float64
	if len(overallPercent) > 0 {
		usage = overallPercent[0]
	}

	res := CPUInfoResponse{
		LogicalCores:   logicalCores,
		PhysicalCores:  physicalCores,
		OverallPercent: overallPercent,
		UsagePercent:   usage,
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(res); err != nil {
		http.Error(w, "Error encoding response", http.StatusInternalServerError)
		return
	}
}
