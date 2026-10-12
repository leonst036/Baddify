package routes

import (
	"net/http"

	"github.com/go-chi/chi/v5"
)

func RegisterRootRoutes(r chi.Router) {
	r.Get("/", Root)
}

func Root(w http.ResponseWriter, r *http.Request) {
	http.Redirect(w, r, "http://localhost:5173", http.StatusTemporaryRedirect)
}
