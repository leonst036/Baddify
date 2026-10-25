# Baddify

A clone of coolify, but with more features.

#### ⚠️ Currently in early stages of development, not production ready.

## Planned Features

- Edge Function Deployments
- Container Deployments
- Database Deployments
- Storage Deployments
- Database Backups
- Storage Backups
- Team Management
- Role-Based Access Control
- Two-Factor Authentication
- Activity Logs
- Audit Logs
- Webhooks
- SSH Key Management
- SSL Certificate Management
- Domain Management
- Health Monitoring
- Performance Monitoring
- Security Monitoring
- Cost Monitoring
- Alerting
- Auto-Scaling
- Auto-Healing
- Auto-Backups
- Auto-Updates
- Auto-Deployments

And more...

## Tech Stack

Frontend:
- React
- TypeScript
- Tailwind CSS
- Material UI

Backend:
- Go
- MongoDB


## Installation & Running

### AppImage (Production Standalone)

Build the standalone AppImage:

```bash
./scripts/build-appimage.sh
```

Run the AppImage:

```bash
./Baddify-x86_64.AppImage
```

Options:
- `--no-browser`: Run Baddify in terminal without automatically opening the default web browser.
- `--help`: Show usage and available flags.

### Development Mode

Run the local development stack:

```bash
./dev/start-dev.sh
```

Default credentials:

- Username: `admin`
- Password: `password123`

## License

This project is licensed under the [PolyForm Noncommercial License 1.0.0](https://polyformproject.org/licenses/noncommercial/1.0.0). See [LICENSE](LICENSE) for details.