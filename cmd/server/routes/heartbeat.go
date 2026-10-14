package routes

import (
	"net/http"

	"github.com/go-chi/chi/v5"
)

func RegisterHeartbeatRoutes(r chi.Router) {
	r.Get("/api/heartbeat", Heartbeat)
}

func Heartbeat(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusOK)
}
