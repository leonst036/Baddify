package routes

import (
	"encoding/json"
	"net/http"

	"baddify/cmd/database"
	"baddify/pkg/auth"
	"baddify/pkg/docker"

	"github.com/go-chi/chi/v5"
)

func RegisterProjectRoutes(r chi.Router, dm *docker.Manager, db *database.MongoManager) {
	r.Get("/api/projects/new", NewProject(db))
	r.Get("/api/projects", GetProjects(db))
}

func resolveUserUUID(r *http.Request, db *database.MongoManager) string {
	if claims, ok := auth.GetUserClaims(r.Context()); ok {
		if claims.UserUUID != "" {
			return claims.UserUUID
		}
		if claims.Username != "" {
			if u, err := db.GetUserByUsername(r.Context(), claims.Username); err == nil && u.UUID != "" {
				return u.UUID
			}
		}
	}

	token := auth.ExtractToken(r)
	if token != "" {
		if claims, err := auth.ValidateToken(token); err == nil {
			if claims.UserUUID != "" {
				return claims.UserUUID
			}
			if claims.Username != "" {
				if u, err := db.GetUserByUsername(r.Context(), claims.Username); err == nil && u.UUID != "" {
					return u.UUID
				}
			}
		}
	}

	return r.URL.Query().Get("user_uuid")
}

func NewProject(db *database.MongoManager) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userUUID := resolveUserUUID(r, db)
		if userUUID == "" {
			http.Error(w, "Unauthorized: user uuid is required", http.StatusUnauthorized)
			return
		}

		projectName := r.URL.Query().Get("project_name")
		projectDescription := r.URL.Query().Get("project_description")
		if projectName == "" {
			http.Error(w, "Project name is required", http.StatusBadRequest)
			return
		}

		if projectDescription == "" {
			projectDescription = "No Description"
		}

		if db.ProjectExists(projectName) {
			http.Error(w, "Project already exists", http.StatusBadRequest)
			return
		}

		project := &database.Project{
			UserUUID:    userUUID,
			Name:        projectName,
			Description: projectDescription,
		}

		if err := db.SaveProject(r.Context(), project); err != nil {
			http.Error(w, "Failed to create project", http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusOK)
		w.Write([]byte("Project created successfully"))
	}
}

func GetProjects(db *database.MongoManager) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userUUID := resolveUserUUID(r, db)
		var projects []database.Project
		var err error

		if userUUID != "" {
			projects, err = db.GetProjectsByUserUUID(r.Context(), userUUID)
		} else {
			projects, err = db.GetProjects(r.Context())
		}

		if err != nil {
			http.Error(w, "Failed to fetch projects", http.StatusInternalServerError)
			return
		}

		if projects == nil {
			projects = []database.Project{}
		}

		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(projects)
	}
}
