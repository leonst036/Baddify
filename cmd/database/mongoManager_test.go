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
	initialCount, err := manager.CountUsers(ctx)
	if err != nil {
		t.Fatalf("CountUsers failed: %v", err)
	}
	if initialCount != 0 {
		t.Errorf("Expected 0 users in fresh test database, got %d", initialCount)
	}

	testUser := fmt.Sprintf("testuser_%d", time.Now().UnixNano())
	testPassword := "secret123"

	user, err := manager.RegisterUser(ctx, testUser, testPassword)
	if err != nil {
		t.Fatalf("RegisterUser failed: %v", err)
	}

	afterCount, err := manager.CountUsers(ctx)
	if err != nil {
		t.Fatalf("CountUsers failed: %v", err)
	}
	if afterCount != 1 {
		t.Errorf("Expected 1 user, got %d", afterCount)
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
	envProject := &Project{
		UserUUID:    user.UUID,
		Name:        fmt.Sprintf("env-proj-%d", time.Now().UnixNano()),
		Description: "Project with environments",
	}
	if err := manager.SaveProject(ctx, envProject); err != nil {
		t.Fatalf("Failed to save project for environment test: %v", err)
	}

	emptyEnvs, err := manager.GetProjectEnviroments(ctx, envProject.UUID)
	if err != nil {
		t.Fatalf("GetProjectEnviroments failed for empty project: %v", err)
	}
	if len(emptyEnvs) != 0 {
		t.Errorf("Expected 0 environments, got %d", len(emptyEnvs))
	}

	env1 := &Environment{
		ProjectUUID: envProject.UUID,
		Name:        "production",
		Type:        "production",
		Status:      "healthy",
		Branch:      "main",
		Variables: []EnvVariable{
			{Key: "NODE_ENV", Value: "production"},
			{Key: "PORT", Value: "8080"},
		},
		Description: "Production environment",
	}

	if err := manager.SaveEnvironment(ctx, env1); err != nil {
		t.Fatalf("SaveEnvironment failed: %v", err)
	}

	if env1.UUID == "" {
		t.Fatalf("Expected SaveEnvironment to generate UUID for environment")
	}

	fetchedEnvs, err := manager.GetProjectEnviroments(ctx, envProject.UUID)
	if err != nil {
		t.Fatalf("GetProjectEnviroments by UUID failed: %v", err)
	}
	if len(fetchedEnvs) != 1 {
		t.Fatalf("Expected 1 environment, got %d", len(fetchedEnvs))
	}
	if fetchedEnvs[0].Name != "production" {
		t.Errorf("Expected environment name 'production', got %s", fetchedEnvs[0].Name)
	}
	if len(fetchedEnvs[0].Variables) != 2 {
		t.Errorf("Expected 2 variables, got %d", len(fetchedEnvs[0].Variables))
	}

	// Fetch environments by project Name
	envsByName, err := manager.GetProjectEnviroments(ctx, envProject.Name)
	if err != nil {
		t.Fatalf("GetProjectEnviroments by Name failed: %v", err)
	}
	if len(envsByName) != 1 || envsByName[0].UUID != env1.UUID {
		t.Errorf("Expected to find environment by project Name")
	}

	// Fetch environments by project ObjectID hex
	envsByID, err := manager.GetProjectEnviroments(ctx, envProject.ID.Hex())
	if err != nil {
		t.Fatalf("GetProjectEnviroments by ID failed: %v", err)
	}
	if len(envsByID) != 1 || envsByID[0].UUID != env1.UUID {
		t.Errorf("Expected to find environment by project ID")
	}

	// Verify alias GetProjectEnvironments
	envsByAlias, err := manager.GetProjectEnvironments(ctx, envProject.UUID)
	if err != nil {
		t.Fatalf("GetProjectEnvironments alias failed: %v", err)
	}
	if len(envsByAlias) != 1 {
		t.Errorf("Expected 1 environment from alias, got %d", len(envsByAlias))
	}

	duplicateEnv := &Environment{
		ProjectUUID: envProject.UUID,
		Name:        "production",
		Type:        "production",
	}
	if err := manager.SaveEnvironment(ctx, duplicateEnv); err != ErrEnvironmentAlreadyExists {
		t.Errorf("Expected ErrEnvironmentAlreadyExists, got %v", err)
	}

	// Test GetEnvironmentByUUID
	byEnvUUID, err := manager.GetEnvironmentByUUID(ctx, env1.UUID)
	if err != nil {
		t.Fatalf("GetEnvironmentByUUID failed: %v", err)
	}
	if byEnvUUID.Name != env1.Name {
		t.Errorf("Expected environment name %s, got %s", env1.Name, byEnvUUID.Name)
	}

	legacyEnv := bson.M{
		"project_uuid": envProject.UUID,
		"name":         "legacy-env",
		"type":         "staging",
		"status":       "healthy",
		"created_at":   time.Now(),
		"updated_at":   time.Now(),
	}
	resLegacyEnv, err := manager.Environments.InsertOne(ctx, legacyEnv)
	if err != nil {
		t.Fatalf("Failed to insert legacy environment: %v", err)
	}
	if err := manager.EnsureEnvironmentUUIDs(ctx); err != nil {
		t.Fatalf("EnsureEnvironmentUUIDs failed: %v", err)
	}
	var migratedEnv Environment
	if err := manager.Environments.FindOne(ctx, bson.M{"_id": resLegacyEnv.InsertedID}).Decode(&migratedEnv); err != nil {
		t.Fatalf("Failed to find migrated environment: %v", err)
	}
	if migratedEnv.UUID == "" {
		t.Errorf("Expected migrated environment to have UUID")
	}

	// Test DeleteEnvironmentByUUID
	if err := manager.DeleteEnvironmentByUUID(ctx, env1.UUID); err != nil {
		t.Fatalf("DeleteEnvironmentByUUID failed: %v", err)
	}

	remainingEnvs, err := manager.GetProjectEnviroments(ctx, envProject.UUID)
	if err != nil {
		t.Fatalf("GetProjectEnviroments failed after delete: %v", err)
	}
	if len(remainingEnvs) != 1 || remainingEnvs[0].Name != "legacy-env" {
		t.Errorf("Expected only legacy-env to remain, got %v", remainingEnvs)
	}
}
