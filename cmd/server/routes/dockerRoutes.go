package routes

import (
	"context"
	"encoding/json"
	"net/http"
	"strings"
	"time"

	"baddify/pkg/docker"

	"github.com/distribution/reference"
	"github.com/go-chi/chi/v5"
)

type ValidationResponse struct {
	Valid         bool   `json:"valid"`
	Reason        string `json:"reason,omitempty"`
	SuggestedRepo string `json:"suggestedRepo,omitempty"`
	Location      string `json:"location,omitempty"`
}

func RegisterDockerRoutes(r chi.Router, dm *docker.Manager) {
	r.Get("/api/containers/validate", ValidateImageName(dm))
}

func ValidateImageName(dm *docker.Manager) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")

		rawName := strings.TrimSpace(r.URL.Query().Get("name"))
		if rawName == "" {
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(ValidationResponse{
				Valid:  false,
				Reason: "name is required",
			})
			return
		}

		named, err := reference.ParseNormalizedNamed(rawName)
		if err != nil {
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(ValidationResponse{
				Valid:  false,
				Reason: err.Error(),
			})
			return
		}

		normalized := reference.TagNameOnly(named).String()
		if !strings.Contains(rawName, ":") {
			normalized = strings.TrimSuffix(normalized, ":latest")
		}

		if dm == nil {
			w.WriteHeader(http.StatusServiceUnavailable)
			json.NewEncoder(w).Encode(ValidationResponse{
				Valid:  false,
				Reason: "docker service unavailable",
			})
			return
		}

		ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
		defer cancel()

		exists, location, err := dm.ImageExists(ctx, rawName)
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(ValidationResponse{
				Valid:  false,
				Reason: "failed to verify image: " + err.Error(),
			})
			return
		}

		if !exists {
			w.WriteHeader(http.StatusOK)
			json.NewEncoder(w).Encode(ValidationResponse{
				Valid:  false,
				Reason: "image not found locally or in remote registry",
			})
			return
		}

		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(ValidationResponse{
			Valid:         true,
			SuggestedRepo: normalized,
			Location:      location,
		})
	}
}

func CreateContainer(dm *docker.Manager) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")

	}
}
