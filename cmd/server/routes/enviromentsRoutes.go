package routes

import (
	"baddify/cmd/database"
	"baddify/pkg/caddy"
	"baddify/pkg/docker"
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
)

func RegisterEnviromentsRoutes(r chi.Router, dm *docker.Manager, cr *caddy.Router, db *database.MongoManager) {
	r.Get("/api/projects/{id}/environments", GetProjectEnvironments(db))
}

func GetProjectEnvironments(db *database.MongoManager) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		projectID := chi.URLParam(r, "id")
		if projectID == "" {
			http.Error(w, "Project ID is required", http.StatusBadRequest)
			return
		}

		envs, err := db.GetProjectEnviroments(r.Context(), projectID)
		if err != nil {
			http.Error(w, "Failed to fetch environments", http.StatusInternalServerError)
			return
		}

		if envs == nil {
			envs = []database.Environment{}
		}

		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(envs)
	}
}
