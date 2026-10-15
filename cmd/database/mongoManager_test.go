package database

import (
	"context"
	"fmt"
	"testing"
	"time"

	"go.mongodb.org/mongo-driver/v2/bson"
)

func TestMongoManagerIntegration(t *testing.T) {
	manager, err := NewMongoManager("", "baddify_test")
	if err != nil {
		t.Fatalf("Failed to initialize MongoManager: %v", err)
	}
	defer func() {
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		_ = manager.Database.Drop(ctx)
		_ = manager.Disconnect(ctx)
	}()

	ctx := context.Background()
	testUser := fmt.Sprintf("testuser_%d", time.Now().UnixNano())
	testPassword := "secret123"

	user, err := manager.RegisterUser(ctx, testUser, testPassword)
	if err != nil {
		t.Fatalf("RegisterUser failed: %v", err)
	}

	if user.Username != testUser {
		t.Errorf("Expected username %s, got %s", testUser, user.Username)
	}

	if user.UUID == "" {
		t.Fatalf("Expected non-empty UUID for user")
	}

	byUUID, err := manager.GetUserByUUID(ctx, user.UUID)
	if err != nil {
		t.Fatalf("GetUserByUUID failed: %v", err)
	}
	if byUUID.Username != testUser {
		t.Errorf("Expected username %s, got %s", testUser, byUUID.Username)
	}

	// Test migration for existing users without UUID
	legacyUser := bson.M{
		"username":   fmt.Sprintf("legacy_%d", time.Now().UnixNano()),
		"password":   "hash",
		"created_at": time.Now(),
		"updated_at": time.Now(),
	}
	resLegacy, err := manager.Users.InsertOne(ctx, legacyUser)
	if err != nil {
		t.Fatalf("Failed to insert legacy user: %v", err)
	}
	if err := manager.EnsureUserUUIDs(ctx); err != nil {
		t.Fatalf("EnsureUserUUIDs migration failed: %v", err)
	}
	var migratedUser User
	if err := manager.Users.FindOne(ctx, bson.M{"_id": resLegacy.InsertedID}).Decode(&migratedUser); err != nil {
		t.Fatalf("Failed to find migrated user: %v", err)
	}
	if migratedUser.UUID == "" {
		t.Errorf("Expected migrated user to have a UUID assigned")
	}

	// Test duplicate registration
	_, err = manager.RegisterUser(ctx, testUser, testPassword)
	if err != ErrUserAlreadyExists {
		t.Errorf("Expected ErrUserAlreadyExists, got %v", err)
	}

	// Test authentication success
	authUser, err := manager.AuthenticateUser(ctx, testUser, testPassword)
	if err != nil {
		t.Fatalf("AuthenticateUser failed: %v", err)
	}
	if authUser.ID != user.ID {
		t.Errorf("Expected user ID %v, got %v", user.ID, authUser.ID)
	}
	if authUser.UUID != user.UUID {
		t.Errorf("Expected user UUID %s, got %s", user.UUID, authUser.UUID)
	}

	// Test invalid password
	_, err = manager.AuthenticateUser(ctx, testUser, "wrongpassword")
	if err != ErrInvalidCredentials {
		t.Errorf("Expected ErrInvalidCredentials, got %v", err)
	}

	// Test deployment save
	dep := &Deployment{
		Image:         "nginx:alpine",
		ContainerName: "test-nginx",
		HostPort:      "8080",
		InternalPort:  "80",
		Domain:        fmt.Sprintf("test-%d.local", time.Now().UnixNano()),
		Status:        "running",
	}

	if err := manager.SaveDeployment(ctx, dep); err != nil {
		t.Fatalf("SaveDeployment failed: %v", err)
	}

	fetchedDep, err := manager.GetDeploymentByDomain(ctx, dep.Domain)
	if err != nil {
		t.Fatalf("GetDeploymentByDomain failed: %v", err)
	}
	if fetchedDep.ContainerName != dep.ContainerName {
		t.Errorf("Expected container name %s, got %s", dep.ContainerName, fetchedDep.ContainerName)
	}

	if err := manager.DeleteDeployment(ctx, fetchedDep.ID); err != nil {
		t.Fatalf("DeleteDeployment failed: %v", err)
	}

	// Test project methods
	projectName := fmt.Sprintf("test-project-%d", time.Now().UnixNano())
	if manager.ProjectExists(projectName) {
		t.Errorf("Expected project %s to not exist yet", projectName)
	}

	project := &Project{
		UserUUID:    user.UUID,
		Name:        projectName,
		Description: "A test project",
	}

	if err := manager.SaveProject(ctx, project); err != nil {
		t.Fatalf("SaveProject failed: %v", err)
	}

	if project.UUID == "" {
		t.Fatalf("Expected SaveProject to generate a UUID for project")
	}

	if !manager.ProjectExists(projectName) {
		t.Errorf("Expected project %s to exist", projectName)
	}

	fetchedProj, err := manager.GetProjectByName(ctx, projectName)
	if err != nil {
		t.Fatalf("GetProjectByName failed: %v", err)
	}
	if fetchedProj.UUID != project.UUID {
		t.Errorf("Expected project UUID %s, got %s", project.UUID, fetchedProj.UUID)
	}
	if fetchedProj.UserUUID != user.UUID {
		t.Errorf("Expected UserUUID %s, got %s", user.UUID, fetchedProj.UserUUID)
	}
	if fetchedProj.Description != project.Description {
		t.Errorf("Expected description %s, got %s", project.Description, fetchedProj.Description)
	}

	byProjUUID, err := manager.GetProjectByUUID(ctx, project.UUID)
	if err != nil {
		t.Fatalf("GetProjectByUUID failed: %v", err)
	}
	if byProjUUID.Name != projectName {
		t.Errorf("Expected project name %s, got %s", projectName, byProjUUID.Name)
	}

	// Test migration of legacy project without UUID
	legacyProj := bson.M{
		"name":        fmt.Sprintf("legacy-proj-%d", time.Now().UnixNano()),
		"description": "legacy",
		"created_at":  time.Now(),
		"updated_at":  time.Now(),
	}
	resLegacyProj, err := manager.Projects.InsertOne(ctx, legacyProj)
	if err != nil {
		t.Fatalf("Failed to insert legacy project: %v", err)
	}
	if err := manager.EnsureProjectUUIDs(ctx); err != nil {
		t.Fatalf("EnsureProjectUUIDs failed: %v", err)
	}
	var migratedProj Project
	if err := manager.Projects.FindOne(ctx, bson.M{"_id": resLegacyProj.InsertedID}).Decode(&migratedProj); err != nil {
		t.Fatalf("Failed to find migrated project: %v", err)
	}
	if migratedProj.UUID == "" {
		t.Errorf("Expected migrated project to have UUID")
	}

	userProjects, err := manager.GetProjectsByUserUUID(ctx, user.UUID)
	if err != nil {
		t.Fatalf("GetProjectsByUserUUID failed: %v", err)
	}
	if len(userProjects) == 0 || userProjects[0].UserUUID != user.UUID {
		t.Errorf("Expected to find project with UserUUID %s", user.UUID)
	}

	if err := manager.DeleteProjectByUUID(ctx, fetchedProj.UUID); err != nil {
		t.Fatalf("DeleteProjectByUUID failed: %v", err)
	}

	if manager.ProjectExists(projectName) {
		t.Errorf("Expected project %s to no longer exist after deletion", projectName)
	}
}
