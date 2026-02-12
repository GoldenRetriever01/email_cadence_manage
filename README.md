# Email Cadence Management System

A complete TypeScript monorepo application for managing email cadences with **Next.js** (frontend), **NestJS** (backend API), and **Temporal.io** (workflow orchestration).

## Features

- ✅ Create and edit email cadences with a web UI
- ✅ Enroll contacts into cadence workflows
- ✅ Execute steps sequentially (send email, wait timers)
- ✅ Monitor workflow execution in real-time
- ✅ Update cadences while workflows are running
- ✅ Mock email sending (always succeeds)
- ✅ Full TypeScript type safety across all apps

## Architecture

```
repo/
├── apps/
│   ├── web/        # Next.js React app (frontend)
│   ├── api/        # NestJS REST API
│   └── worker/     # Temporal.io TypeScript worker
├── package.json    # Root monorepo config
└── tsconfig.base.json
```

## Prerequisites

- **Node.js** 18+ (LTS recommended)
- **Yarn** (workspaces support)
- **Temporal.io Server** running locally or accessible via network

### Installing Temporal.io Locally

Option 1: Using Docker (recommended)
```bash
docker run --name temporal -d \
  -p 7233:7233 \
  -p 8233:8233 \
  temporalio/auto-setup:latest
```

Option 2: Using temporal-cli
```bash
temporal server start-dev
```

## Setup Instructions

### 1. Install Dependencies

```bash
cd e:\project\email_project
yarn install
```

This installs dependencies for all three apps using workspaces.

### 2. Create .env Files (Optional)

Create `.env.local` in the root directory to override defaults:

```env
# Temporal.io Configuration
TEMPORAL_SERVER_ADDRESS=localhost:7233
TEMPORAL_NAMESPACE=default
TEMPORAL_TASK_QUEUE=default

# API Configuration
API_PORT=3001

# Web Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001
```

Individual apps can also have their own `.env.local` files in `apps/api/.env.local`, etc.

## Running the Application

### Development Mode (All Services)

```bash
yarn dev
```

This starts all three services concurrently:
- **Web**: http://localhost:3000
- **API**: http://localhost:3001
- **Worker**: Listening on task queue

### Individual Services

```bash
# Start only the web app
yarn dev:web

# Start only the API
yarn dev:api

# Start only the worker
yarn dev:worker
```

## Usage Guide

### Step 1: Create a Cadence

1. Open http://localhost:3000
2. Go to **Create Cadence** tab
3. Edit the JSON to define your cadence steps:

```json
{
  "id": "cad_123",
  "name": "Welcome Flow",
  "steps": [
    {
      "id": "1",
      "type": "SEND_EMAIL",
      "subject": "Welcome to our service",
      "body": "Hello! Welcome aboard."
    },
    {
      "id": "2",
      "type": "WAIT",
      "seconds": 5
    },
    {
      "id": "3",
      "type": "SEND_EMAIL",
      "subject": "Follow-up",
      "body": "How are you doing?"
    }
  ]
}
```

4. Click **Create Cadence**

### Step 2: Enroll a Contact

1. Go to **Enroll Contact** tab
2. Enter:
   - **Cadence ID**: `cad_123` (from step 1)
   - **Contact Email**: `user@example.com`
3. Click **Start Enrollment**

The workflow will start executing steps immediately.

### Step 3: Monitor Execution

1. Go to **Monitor & Update Workflow** tab
2. Click **Refresh Status** to see current progress:
   - **Status**: RUNNING / COMPLETED / FAILED
   - **Current Step**: Which step is executing
   - **Steps Version**: Version of the cadence

### Step 4: Update Cadence In-Flight (Optional)

While a workflow is running, you can update its steps:

1. In **Monitor & Update Workflow**, modify the JSON steps
2. Click **Send Update Signal**
3. The workflow will adopt the new steps and continue from the current step

**Update Logic**:
- Already completed steps remain completed
- If new steps length ≤ current step index, workflow completes
- Otherwise, continues from current step index with new steps
- Steps version increments

## API Endpoints

### Cadences

**POST /cadences** – Create cadence
```bash
curl -X POST http://localhost:3001/cadences \
  -H "Content-Type: application/json" \
  -d '{
    "id": "cad_welcome",
    "name": "Welcome Flow",
    "steps": [
      {"id": "1", "type": "SEND_EMAIL", "subject": "Hi", "body": "Hello"},
      {"id": "2", "type": "WAIT", "seconds": 5}
    ]
  }'
```

**GET /cadences/:id** – Get cadence
```bash
curl http://localhost:3001/cadences/cad_welcome
```

**PUT /cadences/:id** – Update cadence
```bash
curl -X PUT http://localhost:3001/cadences/cad_welcome \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Flow",
    "steps": [...]
  }'
```

**GET /cadences** – List all cadences
```bash
curl http://localhost:3001/cadences
```

### Enrollments

**POST /enrollments** – Start workflow
```bash
curl -X POST http://localhost:3001/enrollments \
  -H "Content-Type: application/json" \
  -d '{
    "cadenceId": "cad_welcome",
    "contactEmail": "user@example.com"
  }'
```

Response:
```json
{
  "id": "enr_abc12345",
  "cadenceId": "cad_welcome",
  "contactEmail": "user@example.com",
  "currentStepIndex": 0,
  "stepsVersion": 0,
  "status": "RUNNING",
  "createdAt": 1707700000000,
  "updatedAt": 1707700000000
}
```

**GET /enrollments/:id** – Get enrollment status
```bash
curl http://localhost:3001/enrollments/enr_abc12345
```

**POST /enrollments/:id/update-cadence** – Send update signal
```bash
curl -X POST http://localhost:3001/enrollments/enr_abc12345/update-cadence \
  -H "Content-Type: application/json" \
  -d '{
    "steps": [
      {"id": "1", "type": "SEND_EMAIL", "subject": "Updated", "body": "New content"},
      {"id": "2", "type": "WAIT", "seconds": 10}
    ]
  }'
```

## How It Works

### Cadence Structure

A cadence is a sequence of steps executed for each enrolled contact:

```typescript
interface Cadence {
  id: string;                    // Unique ID
  name: string;                  // Display name
  steps: CadenceStep[];          // Sequence of steps
}

interface CadenceStep {
  id: string;                    // Step ID
  type: "SEND_EMAIL" | "WAIT";   // Step type
  subject?: string;              // Email subject (for SEND_EMAIL)
  body?: string;                 // Email body (for SEND_EMAIL)
  seconds?: number;              // Wait duration (for WAIT)
}
```

### Workflow Execution

1. **Temporal Worker** picks up enrollment from task queue
2. **Fetches cadence definition** from API
3. **Executes steps sequentially**:
   - `SEND_EMAIL`: Calls mock email activity (logs + returns success)
   - `WAIT`: Uses Temporal timer for sleep
4. **Maintains state**: current step index, steps version, status
5. **Listens for signals**: Can receive `updateCadence` while running
6. **Exposes queries**: `getState()` returns current workflow state

### In-Flight Updates

When a signal is received during execution:

```
Current state: step 1 of 3, version 0
↓
Receive updateCadence with 5 new steps (version 1)
↓
Check: is 1 <= length of new steps? YES
↓
Continue from step 1 with new steps
↓
Increment version → 1
```

Edge case: If new steps = 2 and current step = 2, workflow completes immediately.

## Development

### Project Structure

```
apps/
├── api/
│   ├── src/
│   │   ├── shared/types.ts          # Type definitions
│   │   ├── services/                # Business logic
│   │   │   ├── cadence.service.ts
│   │   │   └── enrollment.service.ts
│   │   ├── controllers/             # HTTP endpoints
│   │   │   ├── cadence.controller.ts
│   │   │   └── enrollment.controller.ts
│   │   ├── app.module.ts            # NestJS module
│   │   └── main.ts                  # Entry point
│   └── package.json
│
├── worker/
│   ├── src/
│   │   ├── shared/types.ts          # Type definitions
│   │   ├── activities/
│   │   │   └── email.ts             # Email mock activity
│   │   ├── workflows/
│   │   │   └── email-cadence.ts     # Main workflow
│   │   └── worker.ts                # Worker startup
│   └── package.json
│
└── web/
    ├── app/
    │   ├── page.tsx                 # Main page
    │   ├── layout.tsx               # Root layout
    │   └── globals.css              # Global styles
    ├── src/
    │   ├── types/index.ts           # TypeScript types
    │   └── lib/api.ts               # API client functions
    └── package.json
```

### TypeScript Configuration

- **Root**: `tsconfig.base.json` – Base configuration for all apps
- **Each app**: `tsconfig.json` – Extends base config

### Scripts

```bash
# Install all dependencies
yarn install

# Development mode (all services)
yarn dev

# Individual services
yarn dev:web
yarn dev:api
yarn dev:worker

# Build all apps
yarn build

# Lint (if configured)
yarn lint
```

## Temporal.io Configuration

### Environment Variables

```env
TEMPORAL_SERVER_ADDRESS=localhost:7233
TEMPORAL_NAMESPACE=default
TEMPORAL_TASK_QUEUE=default
```

### Defaults

- **Server**: `localhost:7233`
- **Namespace**: `default`
- **Task Queue**: `default`

These are used by:
- **Worker**: Connects and listens for tasks
- **API**: Starts workflows and queries/signals them

### Checking Temporal Status

Use Temporal CLI:

```bash
# List workflows
temporal workflow list

# View workflow execution
temporal workflow describe --workflow-id enr_abc12345

# View workflow history
temporal workflow show --workflow-id enr_abc12345
```

Or use Temporal Web UI (if running):
- Visit http://localhost:8233 (if using docker)

## Mock Email Behavior

The email sending activity **always succeeds**. It logs to console:

```
[SEND_EMAIL] Enrollment: enr_abc12345
[SEND_EMAIL] To: user@example.com
[SEND_EMAIL] Subject: Welcome
[SEND_EMAIL] Body: Hello there
[SEND_EMAIL] MessageID: msg_1707700000000
```

Returns:
```json
{
  "success": true,
  "messageId": "msg_1707700000000",
  "timestamp": 1707700000000
}
```

## Troubleshooting

### Issue: "Failed to connect to Temporal server"

**Solution**: Make sure Temporal is running:
```bash
# Check with Temporal CLI
temporal server status

# Or start it
temporal server start-dev
```

### Issue: "Cannot reach API from worker"

**Solution**: Ensure `API_URL` environment variable is set correctly in worker.
Default is `http://localhost:3001`

### Issue: Workflow not starting

**Check**:
1. Worker is running and connected to Temporal
2. API is running and responsive
3. Cadence ID exists (via GET /cadences/:id)
4. Network connectivity between services

### Issue: Updates not being applied

**Check**:
1. Workflow is in "RUNNING" status
2. New steps are valid JSON
3. Temporal connection is stable

## Project Deliverables

✅ Working TypeScript monorepo with three apps
✅ NestJS API with cadence management and enrollment endpoints
✅ Temporal.io worker with sequential step execution
✅ Next.js web UI for managing cadences and workflows
✅ Update-in-flight functionality with proper state management
✅ Mock email activity (always succeeds)
✅ Full type safety across all services
✅ README with setup, usage, and API documentation

## Notes

- **No Docker required** – All services run directly with node/yarn
- **No database** – Uses in-memory storage (suitable for demo)
- **No authentication** – Open endpoints (suitable for demo)
- **TypeScript everywhere** – End-to-end type safety
- **Monorepo structure** – Easy code sharing with workspaces

## License

MIT

---

**Built with**: Next.js 14 • NestJS 10 • Temporal.io SDK • TypeScript 5.3
