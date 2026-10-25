package routes

import (
	"net/http"
	"os"
	"path/filepath"

	"github.com/go-chi/chi/v5"
)

// GetWebDistDir resolves the directory containing compiled web assets.
func GetWebDistDir() string {
	if dir := os.Getenv("BADDIFY_WEB_DIR"); dir != "" {
		if stat, err := os.Stat(dir); err == nil && stat.IsDir() {
			return dir
		}
	}
	if appDir := os.Getenv("APPDIR"); appDir != "" {
		p := filepath.Join(appDir, "usr", "share", "baddify", "web", "dist")
		if stat, err := os.Stat(p); err == nil && stat.IsDir() {
			return p
		}
	}
	candidates := []string{
		"web/dist",
		"../web/dist",
		"../../web/dist",
	}
	for _, c := range candidates {
		if stat, err := os.Stat(c); err == nil && stat.IsDir() {
			return c
		}
	}
	return ""
}

func RegisterRootRoutes(r chi.Router) {
	webDistDir := GetWebDistDir()
	isDev := os.Getenv("BADDIFY_DEV") == "1"

	if webDistDir != "" && !isDev {
		serveIndex := func(w http.ResponseWriter, r *http.Request) {
			http.ServeFile(w, r, filepath.Join(webDistDir, "index.html"))
		}
		serveLogin := func(w http.ResponseWriter, r *http.Request) {
			http.ServeFile(w, r, filepath.Join(webDistDir, "login", "index.html"))
		}
		redirectToLogin := func(w http.ResponseWriter, r *http.Request) {
			http.Redirect(w, r, "/login/#signup", http.StatusFound)
		}
		serveFavicon := func(w http.ResponseWriter, r *http.Request) {
			http.ServeFile(w, r, filepath.Join(webDistDir, "favicon.svg"))
		}

		r.Get("/", serveIndex)
		r.Head("/", serveIndex)
		r.Get("/index.html", serveIndex)
		r.Head("/index.html", serveIndex)
		r.Get("/login", serveLogin)
		r.Head("/login", serveLogin)
		r.Get("/login/*", serveLogin)
		r.Head("/login/*", serveLogin)
		r.Get("/register", redirectToLogin)
		r.Head("/register", redirectToLogin)
		r.Get("/register/*", redirectToLogin)
		r.Head("/register/*", redirectToLogin)
		r.Get("/favicon.svg", serveFavicon)
		r.Head("/favicon.svg", serveFavicon)
		r.Handle("/assets/*", http.StripPrefix("/assets/", http.FileServer(http.Dir(filepath.Join(webDistDir, "assets")))))
	} else {
		r.Get("/", Root)
	}
}

func Root(w http.ResponseWriter, r *http.Request) {
	http.Redirect(w, r, "http://localhost:5173", http.StatusTemporaryRedirect)
}
