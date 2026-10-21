package routes

import (
	"context"
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"strings"

	"baddify/cmd/database"
	"baddify/pkg/caddy"
	"baddify/pkg/docker"

	"github.com/go-chi/chi/v5"
	"go.mongodb.org/mongo-driver/v2/bson"
)

type CreateEnvironmentRequest struct {
	Name        string                 `json:"name"`
	Description string                 `json:"description"`
	Variables   []database.EnvVariable `json:"variables"`
}

func RegisterEnviromentsRoutes(r chi.Router, dm *docker.Manager, cr *caddy.Router, db *database.MongoManager) {
	r.Get("/api/projects/{id}/environments", GetProjectEnvironments(db))
	r.Post("/api/projects/{id}/environments", CreateProjectEnviroment(dm, cr, db))
}

func resolveProjectUUID(ctx context.Context, db *database.MongoManager, projectIdentifier string) string {
	if proj, err := db.GetProjectByUUID(ctx, projectIdentifier); err == nil && proj != nil {
		return proj.UUID
	}
	if proj, err := db.GetProjectByName(ctx, projectIdentifier); err == nil && proj != nil {
		return proj.UUID
	}
	if objID, err := bson.ObjectIDFromHex(projectIdentifier); err == nil {
		if proj, err := db.GetProjectByID(ctx, objID); err == nil && proj != nil {
			return proj.UUID
		}
	}
	return projectIdentifier
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

func CreateProjectEnviroment(dm *docker.Manager, cr *caddy.Router, db *database.MongoManager) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		projectID := chi.URLParam(r, "id")
		if projectID == "" {
			http.Error(w, "Project ID is required", http.StatusBadRequest)
			return
		}

		var req CreateEnvironmentRequest
		if r.Body != nil {
			if err := json.NewDecoder(r.Body).Decode(&req); err != nil && !errors.Is(err, io.EOF) {
				http.Error(w, "Invalid request body", http.StatusBadRequest)
				return
			}
		}

		if req.Name == "" {
			req.Name = r.URL.Query().Get("name")
		}
		if req.Description == "" {
			req.Description = r.URL.Query().Get("description")
		}

		req.Name = strings.TrimSpace(req.Name)
		if req.Name == "" {
			http.Error(w, "Environment name is required", http.StatusBadRequest)
			return
		}

		projectUUID := resolveProjectUUID(r.Context(), db, projectID)

		// Check for existing environment with the same name
		existing, err := db.GetProjectEnvironments(r.Context(), projectUUID)
		if err == nil {
			for _, e := range existing {
				if strings.EqualFold(e.Name, req.Name) {
					http.Error(w, "Environment already exists", http.StatusConflict)
					return
				}
			}
		}

		if req.Variables == nil {
			req.Variables = []database.EnvVariable{}
		}

		env := &database.Environment{
			ProjectUUID: projectUUID,
			Name:        req.Name,
			Description: req.Description,
			Variables:   req.Variables,
		}

		if err := db.SaveEnvironment(r.Context(), env); err != nil {
			if errors.Is(err, database.ErrEnvironmentAlreadyExists) {
				http.Error(w, "Environment already exists", http.StatusConflict)
				return
			}
			http.Error(w, "Failed to create environment", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusCreated)
		_ = json.NewEncoder(w).Encode(env)
	}
}

