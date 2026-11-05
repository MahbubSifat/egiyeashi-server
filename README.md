# EgiyeAshi Server

REST API for **EgiyeAshi**, a community platform to create, join and track social service events.

- **Live API:** https://egiyeashi-server.vercel.app
- **Client repository:** https://github.com/MahbubSifat/egiyeashi-client
- **Live site:** https://egiyeashi-client.vercel.app

## Tech stack

Express.js, MongoDB (native driver), `jose` for JWT verification, deployed on Vercel.

## How authentication works

The client signs users in with Better Auth and gets a JWT. Protected routes require the header `Authorization: Bearer <token>`. The server verifies the token signature with the public keys published by the client app (`/api/auth/jwks`) and uses the email inside the token to decide who owns an event.

## API

| Method | Route | Access |
|---|---|---|
| GET | `/events` (`?limit`, `?type`, `?search`) | Public, upcoming events only |
| GET | `/events/:id` | Public |
| POST | `/events` | JWT |
| PUT | `/events/:id` | JWT, owner only |
| DELETE | `/events/:id` | JWT, owner only |
| POST | `/events/:id/join` | JWT |
| GET | `/events/:id/joined` | JWT |
| GET | `/my-events` | JWT |
| GET | `/joined-events` | JWT, sorted by event date |

## Run locally

```bash
npm install
npm run dev
```

Create a `.env` file (see `.env.example`):

```
PORT=5000
MONGODB_URI=mongodb+srv://mahbubsifatbdu06_db_user:v46J_Vcyd2KXbt%23@cluster0.aev5go8.mongodb.net/apnar_db_name?retryWrites=true&w=majority

DB_NAME=egiyeashi
CLIENT_URL=https://egiyeashi-msifat-gilt.vercel.app,http://localhost:3000

AUTH_URL=https://egiyeashi-msifat-gilt.vercel.app
```