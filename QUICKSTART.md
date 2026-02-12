# Quick Start Guide

## Prerequisites Check

Before running, ensure:

```bash
# Check Node.js version (should be 18+)
node --version

# Check Yarn is installed
yarn --version

# Temporal server should be running
temporal server start-dev
# OR with Docker:
docker run -d --name temporal -p 7233:7233 -p 8233:8233 temporalio/auto-setup:latest
```

## One-Command Startup

From the project root:

```bash
# Install all dependencies
yarn install

# Run all three services
yarn dev
```

Then open:
- **Frontend**: http://localhost:3000
- **API Docs**: http://localhost:3001
- **Temporal UI** (if using docker): http://localhost:8233

## Common Tasks

### Create a Cadence via API

```bash
curl -X POST http://localhost:3001/cadences \
  -H "Content-Type: application/json" \
  -d '{
    "id": "cad_onboarding",
    "name": "Onboarding Sequence",
    "steps": [
      {
        "id": "1",
        "type": "SEND_EMAIL",
        "subject": "Welcome!",
        "body": "Welcome to our platform. Get started here..."
      },
      {
        "id": "2",
        "type": "WAIT",
        "seconds": 3
      },
      {
        "id": "3",
        "type": "SEND_EMAIL",
        "subject": "Set up your profile",
        "body": "Next steps: complete your profile..."
      }
    ]
  }'
```

### Enroll a Contact

```bash
curl -X POST http://localhost:3001/enrollments \
  -H "Content-Type: application/json" \
  -d '{
    "cadenceId": "cad_onboarding",
    "contactEmail": "john@example.com"
  }'
```

Response includes enrollment ID.

### Check Workflow Status

```bash
# Replace enr_xxxxx with actual enrollment ID
curl http://localhost:3001/enrollments/enr_xxxxx
```

### Update Running Workflow

```bash
curl -X POST http://localhost:3001/enrollments/enr_xxxxx/update-cadence \
  -H "Content-Type: application/json" \
  -d '{
    "steps": [
      {"id": "1", "type": "SEND_EMAIL", "subject": "Updated", "body": "New version"},
      {"id": "2", "type": "WAIT", "seconds": 5},
      {"id": "3", "type": "SEND_EMAIL", "subject": "Final", "body": "Done"}
    ]
  }'
```

## Development Workflow

### Make Changes

Edit files in:
- `apps/api/src/**` – API changes
- `apps/worker/src/**` – Worker changes
- `apps/web/app/**` – Frontend changes

### Watch Mode

All services run with auto-reload in `yarn dev`:
- **API**: NestJS watch mode
- **Worker**: ts-node-dev with respawn
- **Web**: Next.js hot reload

Just save and refresh!

### TypeScript Errors

If you see TypeScript errors, the build will fail. Check:

```bash
# Check API types
cd apps/api && npx tsc --noEmit

# Check Worker types
cd apps/worker && npx tsc --noEmit

# Check Web types
cd apps/web && npx tsc --noEmit
```

## Testing the Workflow

1. Open http://localhost:3000
2. **Create Cadence** tab:
   - Use the default template (or modify it)
   - Click "Create Cadence"
3. **Enroll Contact** tab:
   - Cadence ID: `cad_welcome` (or your custom ID)
   - Email: `test@example.com`
   - Click "Start Enrollment"
4. **Monitor & Update** tab:
   - Refresh to watch progress
   - Watch the console for email logs in the worker
   - Optionally update the cadence steps

## Logs

### API Logs
```
yarn dev:api
```
Logs HTTP requests, Temporal connections.

### Worker Logs
```
yarn dev:worker
```
Logs workflow executions, email activity calls, step progress.

### All Logs
```
yarn dev
```
Terminal shows all three services mixed (less clear, but good for demo).

## Environment Setup

Create `.env.local` in root for custom settings:

```env
# Temporal
TEMPORAL_SERVER_ADDRESS=localhost:7233
TEMPORAL_NAMESPACE=default
TEMPORAL_TASK_QUEUE=default

# API
API_PORT=3001

# Web
NEXT_PUBLIC_API_URL=http://localhost:3001
```

Each app also respects `.env.local` in its own directory.

## Stopping Services

Press `Ctrl+C` to stop all services (when using `yarn dev`).

To stop individual services, each runs in its own terminal.

## Network Issues

If services can't communicate:

1. Check all services are running:
   ```bash
   # API
   curl http://localhost:3001/cadences
   
   # Should return empty array
   ```

2. Check Temporal connection from API startup logs:
   ```
   API server is running on http://localhost:3001
   ```

3. Check Worker connects to Temporal:
   ```
   Worker started successfully
   Server: localhost:7233
   ```

## Reset Everything

```bash
# Stop all services (Ctrl+C)

# Clear caches and dependencies
rm -r node_modules
rm -r apps/*/node_modules
rm -r apps/*/dist
rm yarn.lock

# Reinstall
yarn install

# Start fresh
yarn dev
```

## Next Steps

- Modify cadences in the UI
- Test in-flight updates
- Monitor workflows in Temporal Web UI
- Check worker logs for email activity
- Build custom step types (extend SEND_EMAIL and WAIT)
