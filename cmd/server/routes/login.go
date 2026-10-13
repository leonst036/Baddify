package routes

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strings"

	"baddify/cmd/database"

	"github.com/go-chi/chi/v5"
)

func RegisterLoginRoutes(r chi.Router, db *database.MongoManager) {
	r.Post("/api/login", Login(db))
	r.Post("/api/register", Register(db))
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

		http.SetCookie(w, &http.Cookie{
			Name:     "token",
			Value:    "authenticated",
			Path:     "/",
			HttpOnly: false,
		})

		w.WriteHeader(http.StatusOK)
		fmt.Fprintf(w, "Login successful: %s", user.Username)
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

		http.SetCookie(w, &http.Cookie{
			Name:     "token",
			Value:    "authenticated",
			Path:     "/",
			HttpOnly: false,
		})

		w.WriteHeader(http.StatusOK)
		fmt.Fprintf(w, "Registration successful: %s", user.Username)
	}
}
