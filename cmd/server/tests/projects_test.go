package tests

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"net/url"
	"testing"
	"time"

	"baddify/cmd/database"
	"baddify/cmd/server/routes"
	"baddify/pkg/auth"

	"github.com/go-chi/chi/v5"
)

func TestProjectCreationWithUserUUID(t *testing.T) {
	db, teardown := setupTestDB(t)
	defer teardown()

	r := chi.NewRouter()
	r.Use(auth.RequireTokenIfNotProxied(
		"/",
		"/api/login",
		"/api/register",
	))
	routes.RegisterProjectRoutes(r, nil, db)

	ctx := t.Context()
	testUser := fmt.Sprintf("proj_user_%d", time.Now().UnixNano())
	user, err := db.RegisterUser(ctx, testUser, "password123")
	if err != nil {
		t.Fatalf("Failed to register user: %v", err)
	}

	if user.UUID == "" {
		t.Fatalf("Expected registered user to have UUID")
	}

	token, err := auth.GenerateToken(user.ID.Hex(), user.Username, user.UUID)
	if err != nil {
		t.Fatalf("Failed to generate token: %v", err)
	}

	// 1. Creating project without token or user_uuid should fail (401)
	unauthReq := httptest.NewRequest(http.MethodGet, "/api/projects/new?project_name=unauth-proj", nil)
	unauthRec := httptest.NewRecorder()
	r.ServeHTTP(unauthRec, unauthReq)
	if unauthRec.Code != http.StatusUnauthorized {
		t.Errorf("Expected 401 Unauthorized, got %d", unauthRec.Code)
	}

	// 2. Creating project with valid token
	projName := fmt.Sprintf("my-app-%d", time.Now().UnixNano())
	params := url.Values{
		"project_name":        {projName},
		"project_description": {"Test application"},
	}
	createReq := httptest.NewRequest(http.MethodGet, "/api/projects/new?"+params.Encode(), nil)
	createReq.Header.Set("Authorization", "Bearer "+token)
	createRec := httptest.NewRecorder()
	r.ServeHTTP(createRec, createReq)

	if createRec.Code != http.StatusOK {
		t.Fatalf("Expected 200 OK for project creation, got %d: %s", createRec.Code, createRec.Body.String())
	}

	// 3. Verify project exists in database and has correct user_uuid
	proj, err := db.GetProjectByName(ctx, projName)
	if err != nil {
		t.Fatalf("Failed to fetch project: %v", err)
	}
	if proj.UserUUID != user.UUID {
		t.Errorf("Expected Project UserUUID %s, got %s", user.UUID, proj.UserUUID)
	}
	if proj.UUID == "" {
		t.Errorf("Expected Project to have its own UUID")
	}
	if proj.Name != projName {
		t.Errorf("Expected project name %s, got %s", projName, proj.Name)
	}

	// 4. Fetch projects for user
	listReq := httptest.NewRequest(http.MethodGet, "/api/projects", nil)
	listReq.Header.Set("Authorization", "Bearer "+token)
	listRec := httptest.NewRecorder()
	r.ServeHTTP(listRec, listReq)

	if listRec.Code != http.StatusOK {
		t.Fatalf("Expected 200 OK fetching projects, got %d", listRec.Code)
	}

	var projects []database.Project
	if err := json.NewDecoder(listRec.Body).Decode(&projects); err != nil {
		t.Fatalf("Failed to decode projects JSON: %v", err)
	}
	if len(projects) == 0 || projects[0].UserUUID != user.UUID {
		t.Errorf("Expected project list to contain user's project with UUID %s", user.UUID)
	}
}
