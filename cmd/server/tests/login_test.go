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
