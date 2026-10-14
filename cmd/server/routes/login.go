package routes

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strings"

	"baddify/cmd/database"
	"baddify/pkg/auth"

	"github.com/go-chi/chi/v5"
)

func RegisterLoginRoutes(r chi.Router, db *database.MongoManager) {
	r.Post("/api/login", Login(db))
	r.Post("/api/register", Register(db))
	r.Get("/api/verify", Verify)
}

func Verify(w http.ResponseWriter, r *http.Request) {
	claims, ok := auth.GetUserClaims(r.Context())
	if !ok {
		tokenString := auth.ExtractToken(r)
		var err error
		claims, err = auth.ValidateToken(tokenString)
		if err != nil {
			http.Error(w, "Unauthorized: invalid or expired token", http.StatusUnauthorized)
			return
		}
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(map[string]any{
		"valid":    true,
		"user_id":  claims.UserID,
		"username": claims.Username,
	})
}

func parseCredentials(r *http.Request) (string, string, error) {
	if strings.HasPrefix(r.Header.Get("Content-Type"), "application/json") {
		var creds struct {
			Username string `json:"username"`
			Password string `json:"password"`
		}
		if err := json.NewDecoder(r.Body).Decode(&creds); err != nil {
			return "", "", err
		}
		return strings.TrimSpace(creds.Username), creds.Password, nil
	}

	return strings.TrimSpace(r.FormValue("username")), r.FormValue("password"), nil
}

func Login(db *database.MongoManager) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		username, password, err := parseCredentials(r)
		if err != nil || username == "" || password == "" {
			http.Error(w, "Missing username or password", http.StatusBadRequest)
			return
		}

		user, err := db.AuthenticateUser(r.Context(), username, password)
		if err != nil {
			if errors.Is(err, database.ErrInvalidCredentials) || errors.Is(err, database.ErrUserNotFound) {
				http.Error(w, "Invalid username or password", http.StatusUnauthorized)
				return
			}
			http.Error(w, "Internal server error", http.StatusInternalServerError)
			return
		}

		token, err := auth.GenerateToken(user.ID.Hex(), user.Username)
		if err != nil {
			http.Error(w, "Failed to generate token", http.StatusInternalServerError)
			return
		}

		http.SetCookie(w, &http.Cookie{
			Name:     "token",
			Value:    token,
			Path:     "/",
			HttpOnly: false,
		})

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		_ = json.NewEncoder(w).Encode(map[string]string{
			"token":    token,
			"username": user.Username,
			"message":  fmt.Sprintf("Login successful: %s", user.Username),
		})
	}
}

func Register(db *database.MongoManager) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		username, password, err := parseCredentials(r)
		if err != nil || username == "" || password == "" {
			http.Error(w, "Missing username or password", http.StatusBadRequest)
			return
		}

		user, err := db.RegisterUser(r.Context(), username, password)
		if err != nil {
			if errors.Is(err, database.ErrUserAlreadyExists) {
				http.Error(w, "Username already exists", http.StatusConflict)
				return
			}
			http.Error(w, "Registration failed: "+err.Error(), http.StatusInternalServerError)
			return
		}

		token, err := auth.GenerateToken(user.ID.Hex(), user.Username)
		if err != nil {
			http.Error(w, "Failed to generate token", http.StatusInternalServerError)
			return
		}

		http.SetCookie(w, &http.Cookie{
			Name:     "token",
			Value:    token,
			Path:     "/",
			HttpOnly: false,
		})

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		_ = json.NewEncoder(w).Encode(map[string]string{
			"token":    token,
			"username": user.Username,
			"message":  fmt.Sprintf("Registration successful: %s", user.Username),
		})
	}
}
