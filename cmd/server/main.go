package main

import (
	"log"
	"net/http"

	"baddify/pkg/caddy"
	"baddify/pkg/docker"
)

func main() {
	dm, err := docker.NewManager()
	if err != nil {
		log.Fatalf("Docker init failed: %v", err)
	}
	cr := caddy.NewRouter("http://127.0.0.1:2019")

	r := NewRouter(dm, cr)

	log.Println("Control Plane running on port :4000...")
	http.ListenAndServe(":4000", r)
}
