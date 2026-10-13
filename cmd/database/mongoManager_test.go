package database

import (
	"context"
	"fmt"
	"testing"
	"time"
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
}
