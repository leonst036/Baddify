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

func TestValidateImageName(t *testing.T) {
	dm, err := docker.NewManager()
	if err != nil {
		t.Skipf("Docker manager initialization failed, skipping: %v", err)
	}

	r := chi.NewRouter()
	routes.RegisterDockerRoutes(r, dm)

	tests := []struct {
		name          string
		image         string
		expectedCode  int
		expectedValid bool
	}{
		{
			name:          "Empty image name",
			image:         "",
			expectedCode:  http.StatusBadRequest,
			expectedValid: false,
		},
		{
			name:          "Invalid image syntax",
			image:         "INVALID:::IMAGE",
			expectedCode:  http.StatusBadRequest,
			expectedValid: false,
		},
		{
			name:          "Valid remote image (nginx:alpine)",
			image:         "nginx:alpine",
			expectedCode:  http.StatusOK,
			expectedValid: true,
		},
		{
			name:          "Nonexistent remote image",
			image:         "nonexistentimage9876543210qwerty:latest",
			expectedCode:  http.StatusOK,
			expectedValid: false,
		},
		{
			name:          "Local image (mongo:latest)",
			image:         "mongo:latest",
			expectedCode:  http.StatusOK,
			expectedValid: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := httptest.NewRequest(http.MethodGet, "/api/containers/validate?name="+tt.image, nil)
			rec := httptest.NewRecorder()
			r.ServeHTTP(rec, req)

			if rec.Code != tt.expectedCode {
				t.Fatalf("expected status %d, got %d. Body: %s", tt.expectedCode, rec.Code, rec.Body.String())
			}

			var resp routes.ValidationResponse
			if err := json.NewDecoder(rec.Body).Decode(&resp); err != nil {
				t.Fatalf("failed to decode response: %v", err)
			}

			if resp.Valid != tt.expectedValid {
				t.Errorf("expected valid=%v, got %v (reason: %s)", tt.expectedValid, resp.Valid, resp.Reason)
			}
		})
	}
}
