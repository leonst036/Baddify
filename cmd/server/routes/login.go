package routes

import (
	"fmt"
	"net/http"

	"github.com/go-chi/chi/v5"
)

func RegisterLoginRoutes(r chi.Router) {
	r.Post("/api/login", Login)
	r.Post("/api/register", Register)
}

func Login(w http.ResponseWriter, r *http.Request) {
	username := r.FormValue("username")
	password := r.FormValue("password")

	if username == "" || password == "" {
		http.Error(w, "Missing username or password", http.StatusBadRequest)
		return
	}

	if username == "test" && password == "123" {
		http.SetCookie(w, &http.Cookie{
			Name:     "token",
			Value:    "authenticated",
			Path:     "/",
			HttpOnly: false,
		})
		fmt.Println("Login successful")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("Login successful"))
		return
	}

	http.Error(w, "Invalid username or password", http.StatusUnauthorized)
	return
}

func Register(w http.ResponseWriter, r *http.Request) {
	username := r.FormValue("username")
	password := r.FormValue("password")

	if username == "" || password == "" {
		http.Error(w, "Missing username or password", http.StatusBadRequest)
		return
	}

	http.SetCookie(w, &http.Cookie{
		Name:     "token",
		Value:    "authenticated",
		Path:     "/",
		HttpOnly: false,
	})
	fmt.Println("Registration successful")
	w.WriteHeader(http.StatusOK)
	w.Write([]byte("Registration successful"))
	return
}
