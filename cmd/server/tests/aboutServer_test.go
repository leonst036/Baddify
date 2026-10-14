package tests

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"baddify/cmd/server/routes"
	"baddify/pkg/docker"

	"github.com/go-chi/chi/v5"
)

func TestAboutServerNodeInfoAndContainers(t *testing.T) {
	dm, err := docker.NewManager()
	if err != nil {
		t.Logf("Docker manager init skipped: %v", err)
	}

	r := chi.NewRouter()
	routes.RegisterAboutServerRoutes(r, dm)

	req := httptest.NewRequest(http.MethodGet, "/api/node-info", nil)
	rec := httptest.NewRecorder()
	r.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("Expected 200 from /api/node-info, got %d", rec.Code)
	}

	var nodeInfo routes.NodeInfoResponse
	if err := json.NewDecoder(rec.Body).Decode(&nodeInfo); err != nil {
		t.Fatalf("Failed to decode /api/node-info response: %v", err)
	}

	if nodeInfo.Platform == "" && nodeInfo.OS == "" {
		t.Errorf("Expected OS or Platform to be set, got empty")
	}

	if dm != nil {
		reqContainers := httptest.NewRequest(http.MethodGet, "/api/containers", nil)
		recContainers := httptest.NewRecorder()
		r.ServeHTTP(recContainers, reqContainers)

		if recContainers.Code != http.StatusOK {
			t.Fatalf("Expected 200 from /api/containers, got %d", recContainers.Code)
		}
	}
}
