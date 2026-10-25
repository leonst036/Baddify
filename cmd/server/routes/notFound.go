package routes

import (
	"net/http"
	"os"
	"path/filepath"
)

// find404Html locates the 404.html file across distribution and relative directories.
func find404Html() ([]byte, error) {
	if webDist := GetWebDistDir(); webDist != "" {
		candidates := []string{
			filepath.Join(webDist, "src", "404.html"),
			filepath.Join(webDist, "404.html"),
		}
		for _, p := range candidates {
			if data, err := os.ReadFile(p); err == nil {
				return data, nil
			}
		}
	}

	candidates := []string{
		"web/src/404.html",
		"../web/src/404.html",
		"../../web/src/404.html",
		"../../../web/src/404.html",
	}

	for _, p := range candidates {
		if data, err := os.ReadFile(p); err == nil {
			return data, nil
		}
	}

	// Dynamic traversal fallback
	dir, err := os.Getwd()
	if err == nil {
		for i := 0; i < 5; i++ {
			target := filepath.Join(dir, "web", "src", "404.html")
			if data, err := os.ReadFile(target); err == nil {
				return data, nil
			}
			parent := filepath.Dir(dir)
			if parent == dir {
				break
			}
			dir = parent
		}
	}

	return nil, os.ErrNotExist
}

// NotFoundHandler serves web/src/404.html with 404 status code.
func NotFoundHandler(w http.ResponseWriter, r *http.Request) {
	content, err := find404Html()
	if err == nil {
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		w.WriteHeader(http.StatusNotFound)
		_, _ = w.Write(content)
		return
	}

	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	w.WriteHeader(http.StatusNotFound)
	_, _ = w.Write([]byte("<!DOCTYPE html><html><body><h1>404 Not Found</h1></body></html>"))
}
