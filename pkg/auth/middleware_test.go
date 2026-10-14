package auth

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestRequireTokenIfNotProxied_ExemptPath(t *testing.T) {
	middleware := RequireTokenIfNotProxied("/api/login", "/api/register")
	handler := middleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))

	req := httptest.NewRequest(http.MethodPost, "/api/login", nil)
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Errorf("Expected 200 OK for exempt path, got %d", rec.Code)
	}
}

func TestRequireTokenIfNotProxied_ProxiedByCaddy(t *testing.T) {
	middleware := RequireTokenIfNotProxied("/api/login")
	handler := middleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))

	// Non-exempt path with Caddy X-Forwarded-For header
	req := httptest.NewRequest(http.MethodGet, "/deploy", nil)
	req.Header.Set("X-Forwarded-For", "203.0.113.1")
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Errorf("Expected 200 OK for proxied request, got %d", rec.Code)
	}
}

func TestRequireTokenIfNotProxied_MissingToken(t *testing.T) {
	middleware := RequireTokenIfNotProxied("/api/login")
	handler := middleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))

	req := httptest.NewRequest(http.MethodGet, "/deploy", nil)
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusUnauthorized {
		t.Errorf("Expected 401 Unauthorized for non-proxied request without token, got %d", rec.Code)
	}
}

func TestRequireTokenIfNotProxied_InvalidToken(t *testing.T) {
	middleware := RequireTokenIfNotProxied("/api/login")
	handler := middleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))

	req := httptest.NewRequest(http.MethodGet, "/deploy", nil)
	req.Header.Set("Authorization", "Bearer invalid-token-string")
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusUnauthorized {
		t.Errorf("Expected 401 Unauthorized for invalid token, got %d", rec.Code)
	}
}

func TestRequireTokenIfNotProxied_ValidBearerToken(t *testing.T) {
	token, err := GenerateToken("user1", "alice")
	if err != nil {
		t.Fatalf("GenerateToken failed: %v", err)
	}

	middleware := RequireTokenIfNotProxied("/api/login")
	var capturedClaims *Claims
	handler := middleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		claims, ok := GetUserClaims(r.Context())
		if ok {
			capturedClaims = claims
		}
		w.WriteHeader(http.StatusOK)
	}))

	req := httptest.NewRequest(http.MethodGet, "/deploy", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("Expected 200 OK with valid token, got %d", rec.Code)
	}

	if capturedClaims == nil || capturedClaims.Username != "alice" {
		t.Errorf("Expected user claims in context with username alice, got %v", capturedClaims)
	}
}

func TestRequireTokenIfNotProxied_ValidCookieToken(t *testing.T) {
	token, err := GenerateToken("user2", "bob")
	if err != nil {
		t.Fatalf("GenerateToken failed: %v", err)
	}

	middleware := RequireTokenIfNotProxied("/api/login")
	handler := middleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))

	req := httptest.NewRequest(http.MethodGet, "/deploy", nil)
	req.AddCookie(&http.Cookie{Name: "token", Value: token})
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Errorf("Expected 200 OK with valid cookie token, got %d", rec.Code)
	}
}
