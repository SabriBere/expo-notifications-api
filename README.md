# TestNotifications SocketBack

Backend service for the TestNotifications project. It provides an HTTP API to retrieve alert data and register Expo push tokens, and it also exposes a WebSocket server that broadcasts notifications to connected clients.

## Table of Contents

- [Project Goal](#project-goal)
- [Current Scope](#current-scope)
- [Project Stack](#project-stack)
- [Main Dependencies](#main-dependencies)
- [Prerequisites](#prerequisites)
- [Environment Variables](#environment-variables)
- [Installation](#installation)
- [Available Scripts](#available-scripts)
- [Environments and Integration](#environments-and-integration)
- [Architecture](#architecture)
- [Communication Flow Diagram](#communication-flow-diagram)
- [Database and Prisma](#database-and-prisma)
- [Formatting Configuration](#formatting-configuration)

## Project Goal

The goal of this service is to support the mobile app notification flow by:

- exposing an HTTP API for alert retrieval,
- receiving and storing Expo push tokens,
- broadcasting alert payloads through WebSocket,
- forwarding push notifications to Expo Push Services,
- cleaning up invalid tokens returned by Expo.

At the moment, this backend acts as a lightweight notification gateway between the database, Expo Push Services, and the mobile client.

## Current Scope

The backend currently includes:

- an Express HTTP server,
- a standalone WebSocket server,
- a Prisma data layer using SQLite,
- an alerts endpoint,
- a push-token registration endpoint,
- a scheduler that periodically broadcasts alerts,
- integration with Expo Push Services.

## Project Stack

The current stack used in the project is:

- **Language:** TypeScript
- **Runtime:** Node.js
- **HTTP framework:** Express
- **WebSocket layer:** `ws`
- **ORM:** Prisma
- **Database:** SQLite
- **Environment management:** dotenvx
- **Linting / formatting:** ESLint + Prettier

Relevant versions currently installed in the project:

- `express`: `4.22.1`
- `ws`: `8.20.0`
- `@prisma/client`: `5.22.0`
- `prisma`: `5.22.0`
- `typescript`: `5.9.3`

## Main Dependencies

Some of the most relevant dependencies in this repository are:

- **express:** handles the REST API layer.
- **ws:** provides WebSocket server support.
- **@prisma/client / prisma:** manage database access, schema, and migrations.
- **@dotenvx/dotenvx:** loads environment variables for local development.
- **nodemon:** restarts the development server automatically.
- **prettier:** keeps formatting consistent across the codebase.

For the full dependency list, check `package.json`.

## Prerequisites

Before running the backend locally, make sure you have:

- Node.js installed
- npm installed
- a valid `.env.development` file for the development server
- SQLite available through Prisma

> **Important:** this backend is currently configured to use SQLite via Prisma. The default local database file is `prisma/dev.db`.

## Environment Variables

The project currently uses `.env` and `.env.development`.

Variables used by the backend:

- `NODE_ENV`: application environment.
- `PORT`: HTTP server port.
- `SOCKET_PORT`: WebSocket server port.
- `DATABASE_URL`: Prisma connection string.

Current local example from `.env.development`:

```env
NODE_ENV=development
PORT=8000
SOCKET_PORT=8001
DATABASE_URL="file:./dev.db"
```

> **Note:** in the current implementation, HTTP and WebSocket run as separate servers. `PORT` is used for the REST API and `SOCKET_PORT` is used for the WebSocket server.

## Installation

### 1. Clone the repository

```bash
git clone <repository-url>
cd SocketBack
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Review `.env` and `.env.development` and adjust them to your environment as needed.

### 4. Generate Prisma client

```bash
npm run prisma:generate
```

### 5. Run database migrations

```bash
npm run prisma:migrate
```

### 6. Start the development server

```bash
npm run dev
```

## Available Scripts

The scripts currently defined in `package.json` are:

### `npm run dev`

Starts the backend in development mode using `.env.development` and `nodemon`.

### `npm run format`

Formats the project using Prettier.

### `npm run prisma:generate`

Generates the Prisma client from the schema.

### `npm run prisma:migrate`

Runs Prisma migrations in development mode.

### `npm run prisma:seed`

Executes the Prisma seed script.

### `npm run test`

Currently a placeholder script. Automated tests are not implemented yet.

## Environments and Integration

The backend integrates with three main layers:

- the SQLite database through Prisma,
- the frontend mobile client through HTTP and WebSocket,
- Expo Push Services through the Expo push API.

Current behavior:

- the backend starts Express and WebSocket as separate listeners,
- `GET /news/getAll` returns all stored alerts,
- `POST /push-tokens/register` stores Expo push tokens,
- a scheduler emits push notifications every 3 minutes,
- the WebSocket server broadcasts realtime payloads independently,
- push notifications are sent through `https://exp.host/--/api/v2/push/send`.

## Architecture

The main project structure is:

```text
api/
├── config/
│   └── db.ts
├── controllers/
│   ├── newsControllers.ts
│   └── pushTokenControllers.ts
├── routes/
│   ├── news.ts
│   ├── pushTokens.ts
│   └── routes.ts
├── services/
│   ├── newsServices.ts
│   └── pushTokenServices.ts
├── sockets/
│   └── newsSocket.ts
└── server.ts

prisma/
├── migrations/
├── schema.prisma
└── seed.ts
```

### General Description

- **`api/server.ts`**: application entrypoint. Boots Express, CORS, the HTTP server, the standalone WebSocket server, routes, and scheduler.
- **`api/routes/`**: defines the public HTTP endpoints.
- **`api/controllers/`**: handles request/response logic and delegates to services.
- **`api/services/`**: contains the data access and domain operations for alerts and push tokens.
- **`api/sockets/newsSocket.ts`**: manages socket connections, periodic push delivery, payload mapping, realtime socket broadcasting, and invalid token cleanup.
- **`api/config/db.ts`**: initializes the Prisma client.
- **`prisma/schema.prisma`**: defines the `Alert` and `PushToken` models.
- **`prisma/migrations/`**: stores schema migration history.

### Layered Pattern

The project follows a lightweight layered architecture:

- **Routes:** define the public API surface.
- **Controllers:** receive the request and shape the HTTP response.
- **Services:** execute database-related operations and business logic.
- **Sockets:** handle real-time delivery and Expo push integration.
- **Prisma:** acts as the persistence layer over SQLite.

Flow:

`HTTP / Socket -> Controller / Socket Handler -> Service -> Prisma -> Database`

## Communication Flow Diagram

The current communication flow can be summarized like this:

```text
                     TestNotifications Mobile App
                  (Expo client / physical device)
                               |
                               | 1. POST /push-tokens/register
                               v
                    +---------------------------+
                    |      SocketBack API       |
                    |  Express + WebSocket +    |
                    |  broadcast scheduler      |
                    +---------------------------+
                      |           |          |
                      |           |          |
                      |           |          +-------------------+
                      |           |                              |
                      |           | 4. Push payloads             |
                      |           v                              v
                      |   +----------------+          +----------------------+
                      |   | Prisma Client  |          | Expo Push Services   |
                      |   +----------------+          +----------------------+
                      |           |                              |
                      |           | 2. Read alerts /             | 5. Deliver push
                      |           |    save tokens               |    notifications
                      |           v                              |
                      |   +----------------+                     |
                      |   | SQLite DB      |                     |
                      |   +----------------+                     |
                      |                                          |
                      +------------------------------------------+
                               3. WebSocket broadcast
```

### Broadcast Sequence

1. The mobile app registers an Expo push token through the HTTP API.
2. The backend stores the token in the `PushToken` table.
3. Every 3 minutes, the scheduler loads alerts from the `Alert` table.
4. The backend broadcasts the alert payload to connected WebSocket clients.
5. The same alert data is transformed into Expo push messages and sent to Expo Push Services.
6. If Expo reports `DeviceNotRegistered`, the backend deletes those invalid tokens from the database.

## Database and Prisma

The project currently uses Prisma with SQLite.

Defined models:

- **`Alert`**
  - stores the alert payload consumed by the frontend,
  - includes fields such as title, tone, media type, media name, section, and links,
  - enforces unique values for `ConsultasId` and `NoticiaId`.

- **`PushToken`**
  - stores Expo push tokens,
  - avoids duplicates through a unique constraint on `token`,
  - includes `createdAt` and `updatedAt` timestamps.

Useful commands:

```bash
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

## Formatting Configuration

The project includes basic code quality tooling:

- **Prettier:** configured in `.prettierrc`
- **ESLint:** configured in `eslint.config.ts`

Current Prettier settings include:

- semicolons enabled,
- double quotes,
- `printWidth` of `80`,
- `tabWidth` of `2`.

The ESLint setup uses:

- `@eslint/js`
- `typescript-eslint`
- `eslint-config-prettier`
