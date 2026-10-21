package tests

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"baddify/cmd/database"
	"baddify/cmd/server/routes"
	"baddify/pkg/auth"

	"github.com/go-chi/chi/v5"
)

func TestGetProjectEnvironmentsRoute(t *testing.T) {
	db, teardown := setupTestDB(t)
	defer teardown()

	r := chi.NewRouter()
	r.Use(auth.RequireTokenIfNotProxied(
		"/",
		"/api/login",
		"/api/register",
	))
	routes.RegisterEnviromentsRoutes(r, nil, nil, db)

	ctx := t.Context()
	user, err := db.RegisterUser(ctx, fmt.Sprintf("env_user_%d", time.Now().UnixNano()), "password123")
	if err != nil {
		t.Fatalf("Failed to register user: %v", err)
	}

	token, err := auth.GenerateToken(user.ID.Hex(), user.Username, user.UUID)
	if err != nil {
		t.Fatalf("Failed to generate token: %v", err)
	}

	proj := &database.Project{
		UserUUID:    user.UUID,
		Name:        fmt.Sprintf("proj-%d", time.Now().UnixNano()),
		Description: "Route test project",
	}
	if err := db.SaveProject(ctx, proj); err != nil {
		t.Fatalf("Failed to save project: %v", err)
	}

	envProd := &database.Environment{
		ProjectUUID: proj.UUID,
		Name:        "production",
		Type:        "production",
		Status:      "healthy",
		Branch:      "main",
		Variables: []database.EnvVariable{
			{Key: "PORT", Value: "8080"},
		},
		Description: "Production environment",
	}
	if err := db.SaveEnvironment(ctx, envProd); err != nil {
		t.Fatalf("Failed to save environment: %v", err)
	}

	req := httptest.NewRequest(http.MethodGet, fmt.Sprintf("/api/projects/%s/environments", proj.UUID), nil)
	req.Header.Set("Authorization", "Bearer "+token)
	rec := httptest.NewRecorder()
	r.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("Expected 200 OK, got %d: %s", rec.Code, rec.Body.String())
	}

	var envs []database.Environment
	if err := json.NewDecoder(rec.Body).Decode(&envs); err != nil {
		t.Fatalf("Failed to decode response JSON: %v", err)
	}

	if len(envs) != 1 {
		t.Fatalf("Expected 1 environment, got %d", len(envs))
	}
	if envs[0].Name != "production" {
		t.Errorf("Expected environment name 'production', got %s", envs[0].Name)
	}

	reqName := httptest.NewRequest(http.MethodGet, fmt.Sprintf("/api/projects/%s/environments", proj.Name), nil)
	reqName.Header.Set("Authorization", "Bearer "+token)
	recName := httptest.NewRecorder()
	r.ServeHTTP(recName, reqName)

	if recName.Code != http.StatusOK {
		t.Fatalf("Expected 200 OK, got %d: %s", recName.Code, recName.Body.String())
	}

	var envsByName []database.Environment
	if err := json.NewDecoder(recName.Body).Decode(&envsByName); err != nil {
		t.Fatalf("Failed to decode response JSON: %v", err)
	}
	if len(envsByName) != 1 || envsByName[0].UUID != envProd.UUID {
		t.Errorf("Expected to fetch environment by project name")
	}
}

func TestCreateProjectEnvironmentRoute(t *testing.T) {
	db, teardown := setupTestDB(t)
	defer teardown()

	r := chi.NewRouter()
	r.Use(auth.RequireTokenIfNotProxied(
		"/",
		"/api/login",
		"/api/register",
	))
	routes.RegisterEnviromentsRoutes(r, nil, nil, db)

	ctx := t.Context()
	user, err := db.RegisterUser(ctx, fmt.Sprintf("create_env_user_%d", time.Now().UnixNano()), "password123")
	if err != nil {
		t.Fatalf("Failed to register user: %v", err)
	}

	token, err := auth.GenerateToken(user.ID.Hex(), user.Username, user.UUID)
	if err != nil {
		t.Fatalf("Failed to generate token: %v", err)
	}

	proj := &database.Project{
		UserUUID:    user.UUID,
		Name:        fmt.Sprintf("proj-%d", time.Now().UnixNano()),
		Description: "Create env test project",
	}
	if err := db.SaveProject(ctx, proj); err != nil {
		t.Fatalf("Failed to save project: %v", err)
	}

	// 1. Create environment successfully
	payload := map[string]any{
		"name":        "staging",
		"description": "Staging testing environment",
		"variables": []map[string]any{
			{"key": "PORT", "value": "3000", "isSecret": false},
			{"key": "DB_URL", "value": "mongodb://localhost", "isSecret": true},
		},
	}
	body, _ := json.Marshal(payload)

	req := httptest.NewRequest(http.MethodPost, fmt.Sprintf("/api/projects/%s/environments", proj.UUID), bytes.NewReader(body))
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()
	r.ServeHTTP(rec, req)

	if rec.Code != http.StatusCreated {
		t.Fatalf("Expected 201 Created, got %d: %s", rec.Code, rec.Body.String())
	}

	var createdEnv database.Environment
	if err := json.NewDecoder(rec.Body).Decode(&createdEnv); err != nil {
		t.Fatalf("Failed to decode response JSON: %v", err)
	}

	if createdEnv.Name != "staging" {
		t.Errorf("Expected environment name 'staging', got %s", createdEnv.Name)
	}
	if createdEnv.ProjectUUID != proj.UUID {
		t.Errorf("Expected project_uuid %s, got %s", proj.UUID, createdEnv.ProjectUUID)
	}
	if len(createdEnv.Variables) != 2 {
		t.Errorf("Expected 2 variables, got %d", len(createdEnv.Variables))
	}

	// 2. Duplicate environment name should return 409 Conflict
	dupReq := httptest.NewRequest(http.MethodPost, fmt.Sprintf("/api/projects/%s/environments", proj.UUID), bytes.NewReader(body))
	dupReq.Header.Set("Authorization", "Bearer "+token)
	dupReq.Header.Set("Content-Type", "application/json")
	dupRec := httptest.NewRecorder()
	r.ServeHTTP(dupRec, dupReq)

	if dupRec.Code != http.StatusConflict {
		t.Fatalf("Expected 409 Conflict for duplicate name, got %d", dupRec.Code)
	}
}

