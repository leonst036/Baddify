package main

import (
	"baddify/cmd/database"
	"baddify/cmd/server/routes"
	"baddify/pkg/auth"
	"baddify/pkg/caddy"
	"baddify/pkg/docker"

	"github.com/go-chi/chi/v5"
)

// NewRouter initializes Chi router and registers all application routes.
func NewRouter(dm *docker.Manager, cr *caddy.Router, db *database.MongoManager) *chi.Mux {
	r := chi.NewRouter()

	r.Use(auth.RequireTokenIfNotProxied(
		"/",
		"/api/login",
		"/api/register",
		"/api/containers/validate",
	))

	routes.RegisterRootRoutes(r)
	routes.RegisterDeployRoutes(r, dm, cr)
	routes.RegisterLoginRoutes(r, db)
	routes.RegisterAboutServerRoutes(r, dm)
	routes.RegisterHeartbeatRoutes(r)
	routes.RegisterProjectRoutes(r, dm, db)
	routes.RegisterEnviromentsRoutes(r, dm, cr, db)
	routes.RegisterDockerRoutes(r, dm)

	r.NotFound(routes.NotFoundHandler)

	return r
}
