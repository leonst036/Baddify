package tests

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"baddify/cmd/server/routes"
)

func TestNotFoundHandler(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/nonexistent-route", nil)
	rec := httptest.NewRecorder()

	routes.NotFoundHandler(rec, req)

	if rec.Code != http.StatusNotFound {
		t.Fatalf("Expected status 404, got %d", rec.Code)
	}

	contentType := rec.Header().Get("Content-Type")
	if !strings.Contains(contentType, "text/html") {
		t.Errorf("Expected Content-Type text/html, got %s", contentType)
	}

	body := rec.Body.String()
	if !strings.Contains(body, "404 - Resource not found") {
		t.Errorf("Expected 404.html content in body, got: %s", body)
	}
}
