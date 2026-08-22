# Expo Notifications API

Generic demo backend for the expo-push-notifications mobile application. It exposes
an HTTP API, stores Expo push tokens, and sends sample push notifications.

The repository intentionally uses invented data and neutral field names. It is
designed as a public technical lab rather than an integration with a real
business domain.

## Companion project

This backend is designed to work with
[expo-push-notifications](https://github.com/SabriBere/expo-push-notifications), an Expo /
React Native mobile client used to test push notifications, deep linking and
HTTP communication.

```text
expo-push-notifications (Expo / React Native)
              ↕
             HTTP
              ↕
expo-notifications-api (Node.js / Express / Prisma)
              ↓
       Expo Push Service
```

## Features

- Express HTTP API
- SQLite persistence through Prisma
- idempotent Expo push-token registration
- idempotent scheduled delivery through Expo Push Service
- generic, seeded demo notifications

## Requirements

- Node.js 20 or later
- npm

## Environment

Create `.env.development`:

```env
PORT=8000
DATABASE_URL=file:./dev.db
ENABLE_PUSH_SCHEDULER=false
```

Push delivery is disabled by default. Set `ENABLE_PUSH_SCHEDULER=true` to start
the demo scheduler when the server boots. This opt-in prevents a fresh local
installation from sending notifications unexpectedly.

## Installation

```bash
npm install
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

`npm run prisma:migrate` creates `prisma/dev.db` when it does not exist and
then applies every committed migration. No manual SQLite setup is required.

The HTTP service listens on:

```text
HTTP: http://localhost:8000
```

## HTTP API

### List demo notifications

```http
GET /notifications
```

Example response:

```json
{
  "data": [
    {
      "id": 1,
      "itemId": 101,
      "contextId": 1001,
      "title": "A new demo item is ready to review",
      "sourceType": "web",
      "source": "Demo Feed",
      "category": "Product updates",
      "link": "https://example.com/demo/101"
    }
  ]
}
```

### Register an Expo push token

```http
POST /push-tokens/register
Content-Type: application/json
```

```json
{
  "token": "ExponentPushToken[demo-token]"
}
```

Registration uses an upsert, so sending the same token more than once does not
create duplicates.

## Push payload

Remote notifications use a deliberately small, generic payload:

```json
{
  "itemId": 101,
  "contextId": 1001,
  "url": "/demo-items/101"
}
```

No user identifiers, credentials, or domain-specific metadata are included.

## Delivery flow

```text
Mobile app
  ├─ GET /notifications
  └─ POST /push-tokens/register

Scheduler (`ENABLE_PUSH_SCHEDULER=true`)
  └─ every 3 minutes
       ├─ load demo notifications
       ├─ load registered tokens
       ├─ claim each notification/token pair once
       └─ send pending deliveries through Expo Push Service
```

Successful deliveries are persisted by notification and push-token ID. Later
scheduler runs skip those pairs, and an in-process lock prevents overlapping
runs. Failed requests release their claims so they can be retried, while stale
claims left by an interrupted process become eligible again after ten minutes.

## Project structure

```text
api/
├── controllers/
│   ├── notificationControllers.ts
│   └── pushTokenControllers.ts
├── routes/
│   ├── notifications.ts
│   ├── pushTokens.ts
│   └── routes.ts
├── services/
│   ├── notificationServices.ts
│   ├── notificationScheduler.ts
│   └── pushTokenServices.ts
└── server.ts

mocks/
└── demoNotifications.ts

prisma/
├── migrations/
├── schema.prisma
└── seed.ts
```

## License

MIT. See [LICENSE](LICENSE).
