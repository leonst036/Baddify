package main

import (
	"context"
	"log"
	"net/http"
	"time"

	"baddify/cmd/database"
	"baddify/pkg/caddy"
	"baddify/pkg/docker"
)

func main() {
	dm, err := docker.NewManager()
	if err != nil {
		log.Fatalf("Docker init failed: %v", err)
	}
	cr := caddy.NewRouter("http://127.0.0.1:2019")

	db, err := database.NewMongoManager("", "")
	if err != nil {
		log.Fatalf("Database init failed: %v", err)
	}
	defer func() {
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		_ = db.Disconnect(ctx)
	}()

	r := NewRouter(dm, cr, db)

	log.Println("Control Plane running on port :4000...")
	http.ListenAndServe(":4000", r)
}
