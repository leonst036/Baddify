package tests

import (
	"context"
	"fmt"
	"net/http"
	"net/http/httptest"
	"net/url"
	"strings"
	"testing"
	"time"

	"baddify/cmd/database"
	"baddify/cmd/server/routes"
	"baddify/pkg/auth"

	"github.com/go-chi/chi/v5"
)

func setupTestDB(t *testing.T) (*database.MongoManager, func()) {
	db, err := database.NewMongoManager("", "baddify_routes_test")
	if err != nil {
		t.Fatalf("Failed to initialize test MongoManager: %v", err)
	}

	teardown := func() {
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		_ = db.Database.Drop(ctx)
		_ = db.Disconnect(ctx)
	}

	return db, teardown
}

func TestLoginAndRegisterRoutes(t *testing.T) {
	db, teardown := setupTestDB(t)
	defer teardown()

	r := chi.NewRouter()
	routes.RegisterLoginRoutes(r, db)

	testUser := fmt.Sprintf("user_%d", time.Now().UnixNano())
	testPassword := "secretPassword123"

	// 1. Register user
	formData := url.Values{
		"username": {testUser},
		"password": {testPassword},
	}
	req := httptest.NewRequest(http.MethodPost, "/api/register", strings.NewReader(formData.Encode()))
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	rec := httptest.NewRecorder()
	r.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("Expected registration status 200, got %d: %s", rec.Code, rec.Body.String())
	}

	cookies := rec.Result().Cookies()
	var tokenCookie *http.Cookie
	for _, c := range cookies {
		if c.Name == "token" {
			tokenCookie = c
			break
		}
	}
	if tokenCookie == nil {
		t.Fatal("Expected token cookie to be set on register")
	}
	claims, err := auth.ValidateToken(tokenCookie.Value)
	if err != nil {
		t.Fatalf("Expected valid JWT token on register, got error: %v", err)
	}
	if claims.Username != testUser {
		t.Errorf("Expected claim username %s, got %s", testUser, claims.Username)
	}

	// 2. Duplicate registration should return 409 Conflict
	dupReq := httptest.NewRequest(http.MethodPost, "/api/register", strings.NewReader(formData.Encode()))
	dupReq.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	dupRec := httptest.NewRecorder()
	r.ServeHTTP(dupRec, dupReq)

	if dupRec.Code != http.StatusConflict {
		t.Errorf("Expected status 409 Conflict, got %d", dupRec.Code)
	}

	// 3. Login with correct credentials
	loginReq := httptest.NewRequest(http.MethodPost, "/api/login", strings.NewReader(formData.Encode()))
	loginReq.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	loginRec := httptest.NewRecorder()
	r.ServeHTTP(loginRec, loginReq)

	if loginRec.Code != http.StatusOK {
		t.Fatalf("Expected login status 200, got %d: %s", loginRec.Code, loginRec.Body.String())
	}

	var loginTokenCookie *http.Cookie
	for _, c := range loginRec.Result().Cookies() {
		if c.Name == "token" {
			loginTokenCookie = c
			break
		}
	}
	if loginTokenCookie == nil {
		t.Fatal("Expected token cookie to be set on login")
	}
	loginClaims, err := auth.ValidateToken(loginTokenCookie.Value)
	if err != nil {
		t.Fatalf("Expected valid JWT token on login, got error: %v", err)
	}
	if loginClaims.Username != testUser {
		t.Errorf("Expected claim username %s, got %s", testUser, loginClaims.Username)
	}

	// 4. Login with incorrect password should return 401 Unauthorized
	badFormData := url.Values{
		"username": {testUser},
		"password": {"wrongPassword"},
	}
	badLoginReq := httptest.NewRequest(http.MethodPost, "/api/login", strings.NewReader(badFormData.Encode()))
	badLoginReq.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	badLoginRec := httptest.NewRecorder()
	r.ServeHTTP(badLoginRec, badLoginReq)

	if badLoginRec.Code != http.StatusUnauthorized {
		t.Errorf("Expected status 401 Unauthorized, got %d", badLoginRec.Code)
	}

	// 5. Login with missing username should return 400 Bad Request
	emptyReq := httptest.NewRequest(http.MethodPost, "/api/login", strings.NewReader("username=&password="))
	emptyReq.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	emptyRec := httptest.NewRecorder()
	r.ServeHTTP(emptyRec, emptyReq)

	if emptyRec.Code != http.StatusBadRequest {
		t.Errorf("Expected status 400 Bad Request, got %d", emptyRec.Code)
	}
}

func TestTokenEnforcementOnProtectedRoutes(t *testing.T) {
	r := chi.NewRouter()
	r.Use(auth.RequireTokenIfNotProxied(
		"/",
		"/api/login",
		"/api/register",
	))

	r.Get("/api/protected", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("protected-content"))
	})

	// 1. Direct request without token should return 401 Unauthorized
	req1 := httptest.NewRequest(http.MethodGet, "/api/protected", nil)
	rec1 := httptest.NewRecorder()
	r.ServeHTTP(rec1, req1)
	if rec1.Code != http.StatusUnauthorized {
		t.Errorf("Expected 401 Unauthorized for direct request without token, got %d", rec1.Code)
	}

	// 2. Request through Caddy reverse proxy without token should be allowed (200 OK)
	req2 := httptest.NewRequest(http.MethodGet, "/api/protected", nil)
	req2.Header.Set("X-Forwarded-For", "192.168.1.1")
	rec2 := httptest.NewRecorder()
	r.ServeHTTP(rec2, req2)
	if rec2.Code != http.StatusOK {
		t.Errorf("Expected 200 OK for proxied request, got %d", rec2.Code)
	}

	// 3. Direct request with valid token in Authorization header should be allowed
	token, err := auth.GenerateToken("test-id", "testuser")
	if err != nil {
		t.Fatalf("Failed to generate token: %v", err)
	}
	req3 := httptest.NewRequest(http.MethodGet, "/api/protected", nil)
	req3.Header.Set("Authorization", "Bearer "+token)
	rec3 := httptest.NewRecorder()
	r.ServeHTTP(rec3, req3)
	if rec3.Code != http.StatusOK {
		t.Errorf("Expected 200 OK with Bearer token, got %d", rec3.Code)
	}

	// 4. Direct request with valid token in Cookie should be allowed
	req4 := httptest.NewRequest(http.MethodGet, "/api/protected", nil)
	req4.AddCookie(&http.Cookie{Name: "token", Value: token})
	rec4 := httptest.NewRecorder()
	r.ServeHTTP(rec4, req4)
	if rec4.Code != http.StatusOK {
		t.Errorf("Expected 200 OK with cookie token, got %d", rec4.Code)
	}

	// 5. Test /api/verify with valid token
	routes.RegisterLoginRoutes(r, nil)
	verifyReq := httptest.NewRequest(http.MethodGet, "/api/verify", nil)
	verifyReq.Header.Set("Authorization", "Bearer "+token)
	verifyRec := httptest.NewRecorder()
	r.ServeHTTP(verifyRec, verifyReq)
	if verifyRec.Code != http.StatusOK {
		t.Errorf("Expected 200 OK for /api/verify with valid token, got %d", verifyRec.Code)
	}

	// 6. Test /api/verify with invalid token returns 401
	badVerifyReq := httptest.NewRequest(http.MethodGet, "/api/verify", nil)
	badVerifyReq.Header.Set("Authorization", "Bearer invalid-token")
	badVerifyRec := httptest.NewRecorder()
	r.ServeHTTP(badVerifyRec, badVerifyReq)
	if badVerifyRec.Code != http.StatusUnauthorized {
		t.Errorf("Expected 401 Unauthorized for /api/verify with invalid token, got %d", badVerifyRec.Code)
	}
}

