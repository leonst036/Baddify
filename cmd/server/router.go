package main

import (
	"baddify/cmd/database"
	"baddify/cmd/server/routes"
	"baddify/pkg/caddy"
	"baddify/pkg/docker"

	"github.com/go-chi/chi/v5"
)

// NewRouter initializes Chi router and registers all application routes.
func NewRouter(dm *docker.Manager, cr *caddy.Router, db *database.MongoManager) *chi.Mux {
	r := chi.NewRouter()

	routes.RegisterRootRoutes(r)
	routes.RegisterDeployRoutes(r, dm, cr)
	routes.RegisterLoginRoutes(r, db)
	routes.RegisterAboutServerRoutes(r)

	return r
}
