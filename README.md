# EnvMemo API

A NestJS API for managing environment variables across projects with team collaboration.

## Tech Stack

- **Runtime:** Node.js
- **Framework:** NestJS 11
- **ORM:** Prisma 7 + PostgreSQL
- **Auth:** JWT (access + refresh tokens) via passport-jwt
- **Email:** @nestjs-modules/mailer + nodemailer
- **Validation:** class-validator + class-transformer

## Prerequisites

- Node.js 20+
- PostgreSQL 16+
- npm or yarn

## Setup

```bash
# Install dependencies
npm install

# Start PostgreSQL via Docker
docker compose up -d db

# Apply database migrations
npx prisma migrate deploy

# (Optional) Seed the database
npx prisma db seed
```

## Environment Variables

Copy `.env` and configure:

| Variable       | Default                                                                   | Description                  |
| -------------- | ------------------------------------------------------------------------- | ---------------------------- |
| `DATABASE_URL` | `postgresql://postgres:password@localhost:5432/env-memo-db?schema=public` | PostgreSQL connection        |
| `JWT_SECRET`   | —                                                                         | JWT signing secret           |
| `API_PORT`     | `8080`                                                                    | API server port              |
| `SMTP_HOST`    | `smtp.example.com`                                                        | SMTP server hostname         |
| `SMTP_PORT`    | `587`                                                                     | SMTP server port             |
| `SMTP_USER`    | —                                                                         | SMTP username                |
| `SMTP_PASS`    | —                                                                         | SMTP password                |
| `EMAIL_FROM`   | `noreply@example.com`                                                     | Sender email address         |
| `FRONTEND_URL` | `http://localhost:3000`                                                   | Frontend URL for email links |

> When SMTP is unconfigured (empty `SMTP_USER`/`SMTP_PASS`), emails are logged to the console instead of sent.

## Running

```bash
# Development (watch mode)
npm run start:dev

# Production build
npm run build && npm run start:prod
```

The API starts on `http://localhost:8080` with the global prefix `/api`.

## Scripts

| Command              | Description                     |
| -------------------- | ------------------------------- |
| `npm run build`      | Compile TypeScript              |
| `npm run start`      | Start the server                |
| `npm run start:dev`  | Start with hot-reload           |
| `npm run start:prod` | Start compiled production build |
| `npm run lint`       | Lint and fix source files       |
| `npm run test`       | Run unit tests                  |
| `npm run test:e2e`   | Run end-to-end tests            |

## API Documentation

See [API-DOCUMENT.md](./API-DOCUMENT.md) for the full API reference.

## Deployment

Build the Docker image:

```bash
docker compose build
docker compose up
```

Or deploy the `dist/` output to any Node.js host with PostgreSQL.
