package auth

import (
	"context"
	"net/http"
	"strings"
)

type contextKey string

const (
	UserClaimsKey contextKey = "user_claims"
)

// IsProxiedThroughCaddy checks whether the request originated from the Caddy reverse proxy.
func IsProxiedThroughCaddy(r *http.Request) bool {
	if r.Header.Get("X-Caddy-Proxy") != "" {
		return true
	}
	if r.Header.Get("X-Forwarded-For") != "" || r.Header.Get("X-Forwarded-Host") != "" || r.Header.Get("X-Forwarded-Proto") != "" {
		return true
	}
	if strings.Contains(strings.ToLower(r.Header.Get("Via")), "caddy") {
		return true
	}
	return false
}

// ExtractToken extracts a token from the Authorization header, Cookie, or X-Auth-Token header.
func ExtractToken(r *http.Request) string {
	authHeader := r.Header.Get("Authorization")
	if authHeader != "" {
		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) == 2 && strings.EqualFold(parts[0], "bearer") {
			return strings.TrimSpace(parts[1])
		}
		return strings.TrimSpace(authHeader)
	}

	if cookie, err := r.Cookie("token"); err == nil && cookie.Value != "" {
		return cookie.Value
	}

	if token := r.Header.Get("X-Auth-Token"); token != "" {
		return strings.TrimSpace(token)
	}

	return ""
}

// RequireTokenIfNotProxied returns middleware that requires a valid token when requests do not come through Caddy.
func RequireTokenIfNotProxied(exemptPaths ...string) func(http.Handler) http.Handler {
	exemptMap := make(map[string]bool)
	for _, p := range exemptPaths {
		exemptMap[p] = true
	}

	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			path := r.URL.Path
			trimmed := strings.TrimSuffix(path, "/")
			if trimmed == "" {
				trimmed = "/"
			}

			// Allow exempt endpoints without token
			if exemptMap[path] || exemptMap[trimmed] {
				next.ServeHTTP(w, r)
				return
			}

			// Allow requests forwarded through Caddy reverse proxy
			if IsProxiedThroughCaddy(r) {
				if tokenString := ExtractToken(r); tokenString != "" {
					if claims, err := ValidateToken(tokenString); err == nil {
						r = r.WithContext(context.WithValue(r.Context(), UserClaimsKey, claims))
					}
				}
				next.ServeHTTP(w, r)
				return
			}

			// Request is not proxied, require valid token
			tokenString := ExtractToken(r)
			if tokenString == "" {
				http.Error(w, "Unauthorized: authentication token required", http.StatusUnauthorized)
				return
			}

			claims, err := ValidateToken(tokenString)
			if err != nil {
				http.Error(w, "Unauthorized: invalid or expired token", http.StatusUnauthorized)
				return
			}

			ctx := context.WithValue(r.Context(), UserClaimsKey, claims)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// GetUserClaims retrieves authenticated user claims from context.
func GetUserClaims(ctx context.Context) (*Claims, bool) {
	claims, ok := ctx.Value(UserClaimsKey).(*Claims)
	return claims, ok
}
