package routes

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"

	"baddify/pkg/caddy"
	"baddify/pkg/docker"

	"github.com/go-chi/chi/v5"
)

type DeployRequest struct {
	Image         string `json:"image"`
	ContainerName string `json:"container_name"`
	HostPort      string `json:"host_port"`
	InternalPort  string `json:"internal_port"`
	Domain        string `json:"domain"`
}

// RegisterDeployRoutes registers deployment routes.
func RegisterDeployRoutes(r chi.Router, dm *docker.Manager, cr *caddy.Router) {
	r.Post("/deploy", Deploy(dm, cr))
}

// Deploy handles container deployment and Caddy route configuration.
func Deploy(dm *docker.Manager, cr *caddy.Router) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req DeployRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		ctx := context.Background()
		log.Printf("Pulling Image: %s...", req.Image)
		if err := dm.PullImage(ctx, req.Image); err != nil {
			http.Error(w, "Pull failed: "+err.Error(), http.StatusInternalServerError)
			return
		}

		log.Printf("Starting Container: %s...", req.ContainerName)
		cid, err := dm.RunContainer(ctx, req.Image, req.ContainerName, req.HostPort, req.InternalPort)
		if err != nil {
			http.Error(w, "Run failed: "+err.Error(), http.StatusInternalServerError)
			return
		}

		log.Printf("Updating Caddy Routing for: %s...", req.Domain)
		if err := cr.SetRoute(req.Domain, req.HostPort); err != nil {
			http.Error(w, "Routing failed: "+err.Error(), http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusOK)
		fmt.Fprintf(w, "Successfully deployed! ID: %s, Domain: http://%s\n", cid[:12], req.Domain)
	}
}
