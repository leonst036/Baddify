package main

import (
	"bufio"
	"context"
	"errors"
	"flag"
	"fmt"
	"os"
	"strings"
	"time"

	"baddify/cmd/database"
)

func main() {
	userFlag := flag.String("u", "", "Username")
	passFlag := flag.String("p", "", "Password")
	uriFlag := flag.String("uri", "", "MongoDB URI (optional)")
	dbFlag := flag.String("db", "", "Database name (optional)")
	flag.Parse()

	username := *userFlag
	password := *passFlag

	args := flag.Args()
	if username == "" && len(args) > 0 {
		username = args[0]
	}
	if password == "" && len(args) > 1 {
		password = args[1]
	}

	reader := bufio.NewReader(os.Stdin)

	if username == "" {
		fmt.Print("Enter username: ")
		input, err := reader.ReadString('\n')
		if err != nil {
			fmt.Fprintf(os.Stderr, "Error reading username: %v\n", err)
			os.Exit(1)
		}
		username = strings.TrimSpace(input)
	}

	if password == "" {
		fmt.Print("Enter password: ")
		input, err := reader.ReadString('\n')
		if err != nil {
			fmt.Fprintf(os.Stderr, "Error reading password: %v\n", err)
			os.Exit(1)
		}
		password = strings.TrimSpace(input)
	}

	if username == "" || password == "" {
		fmt.Fprintln(os.Stderr, "Error: Username and password cannot be empty.")
		os.Exit(1)
	}

	db, err := database.NewMongoManager(*uriFlag, *dbFlag)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Failed to connect to MongoDB: %v\n", err)
		os.Exit(1)
	}
	defer func() {
		ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
		defer cancel()
		_ = db.Disconnect(ctx)
	}()

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	user, err := db.RegisterUser(ctx, username, password)
	if err != nil {
		if errors.Is(err, database.ErrUserAlreadyExists) {
			fmt.Fprintf(os.Stderr, "Error: User '%s' already exists.\n", username)
			os.Exit(1)
		}
		fmt.Fprintf(os.Stderr, "Failed to create user: %v\n", err)
		os.Exit(1)
	}

	fmt.Printf("User '%s' created successfully (ID: %s)\n", user.Username, user.ID.Hex())
}
