package routes

import (
	"net/http"

	"baddify/cmd/database"
	"baddify/pkg/docker"

	"github.com/go-chi/chi/v5"
)

func RegisterProjectRoutes(r chi.Router, dm *docker.Manager, db *database.MongoManager) {
	r.Get("/api/projects/new", NewProject(db))
}

func NewProject(db *database.MongoManager) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ProjectName := r.URL.Query().Get("project_name")
		ProjectDescription := r.URL.Query().Get("project_description")
		if ProjectName == "" {
			http.Error(w, "Project name is required", http.StatusBadRequest)
			return
		}

		if ProjectDescription == "" {
			ProjectDescription = "No Description"
		}

		if db.ProjectExists(ProjectName) {
			http.Error(w, "Project already exists", http.StatusBadRequest)
			return
		}

		project := &database.Project{
			Name:        ProjectName,
			Description: ProjectDescription,
		}

		if err := db.SaveProject(r.Context(), project); err != nil {
			http.Error(w, "Failed to create project", http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusOK)
		w.Write([]byte("Project created successfully"))
	}
}
