# Dev

Development scripts and configurations.

## Scripts

- **`start-dev.sh`**: Starts Caddy, Vite frontend dev server, and Baddify backend server.
- **`create-user.sh`**: Creates a new user in MongoDB with bcrypt-hashed password.
  ```bash
  # Positional arguments:
  ./create-user.sh <username> <password>

  # Or with flags:
  ./create-user.sh -u <username> -p <password>

  # Or interactively:
  ./create-user.sh

  # Create default user only if database has no users:
  ./create-user.sh -if-empty
  ```