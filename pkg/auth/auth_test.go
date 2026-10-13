package auth

import (
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

func TestGenerateAndValidateToken(t *testing.T) {
	userID := "user123"
	username := "testuser"

	token, err := GenerateToken(userID, username)
	if err != nil {
		t.Fatalf("GenerateToken failed: %v", err)
	}

	if token == "" {
		t.Fatal("Expected non-empty token string")
	}

	claims, err := ValidateToken(token)
	if err != nil {
		t.Fatalf("ValidateToken failed: %v", err)
	}

	if claims.UserID != userID {
		t.Errorf("Expected UserID %s, got %s", userID, claims.UserID)
	}

	if claims.Username != username {
		t.Errorf("Expected Username %s, got %s", username, claims.Username)
	}
}

func TestValidateTokenInvalidSignature(t *testing.T) {
	claims := Claims{
		UserID:   "user123",
		Username: "testuser",
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Hour)),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signed, err := token.SignedString([]byte("different-secret"))
	if err != nil {
		t.Fatalf("Failed to sign token: %v", err)
	}

	_, err = ValidateToken(signed)
	if err == nil {
		t.Fatal("Expected error for token signed with different secret, got nil")
	}
}

func TestValidateExpiredToken(t *testing.T) {
	claims := Claims{
		UserID:   "user123",
		Username: "testuser",
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(-1 * time.Hour)),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signed, err := token.SignedString(getJWTSecret())
	if err != nil {
		t.Fatalf("Failed to sign token: %v", err)
	}

	_, err = ValidateToken(signed)
	if err == nil {
		t.Fatal("Expected error for expired token, got nil")
	}
}
