# Finova Backend

This is the backend service for the Finova application, built with Node.js, Express, Drizzle ORM, and Better Auth.

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** PostgreSQL (via Neon)
- **ORM:** Drizzle ORM
- **Authentication:** Better Auth
- **Validation:** Zod (via Better Auth/Drizzle)

## Prerequisites

- Node.js (v18+ recommended)
- PostgreSQL Database (Neon connection string)

## Setup & Installation

1.  **Install Dependencies:**
    ```bash
    npm install
    ```

2.  **Environment Variables:**
    Create a `.env` file in the `backend` directory with the following variables:
    ```env
    PORT=
    DATABASE_URL=
    BETTER_AUTH_SECRET=
    BETTER_AUTH_URL=http://localhost:5000
    ```

3.  **Database Migration:**
    Push the schema to your Neon database:
    ```bash
    npx drizzle-kit push
    ```
    Or generate and apply migrations:
    ```bash
    npx drizzle-kit generate
    npx drizzle-kit migrate
    ```

4.  **Seed Data:**
    Seed the initial admin user:
    ```bash
    node scripts/seed-admin.js
    ```

## Running the Server

- **Start Server:**
    ```bash
    npm start
    ```
    The server will run on `http://localhost:5000` (or your configured PORT).

## Project Structure

```
backend/
├── config/             # Database configuration
├── controllers/        # Route logic (Admin, etc.)
├── db/                 # Drizzle schema definitions
├── drizzle/            # SQL migration files
├── middleware/         # Auth and error handling middleware
├── routes/             # API route definitions
├── scripts/            # Utility scripts (seeding, testing)
├── auth.js             # Better Auth configuration
├── server.js           # Main application entry point
└── drizzle.config.js   # Drizzle Kit configuration
```

## API Endpoints

### Authentication
Authentication is handled by **Better Auth** mounted at `/api/auth`.
- **Sign In (Email):** `POST /api/auth/sign-in/email`
- **Sign Up (Email):** `POST /api/auth/sign-up/email`
- **Get Session:** `GET /api/auth/get-session`
- **Sign Out:** `POST /api/auth/sign-out`

### Admin
- **Create User:** `POST /api/admin/users`
    - Requires Authentication and `admin` role.
    - Body: `{ email, password, name, role ,etc }`

## Authentication Flow

1.  **Login:** Frontend sends credentials to `/api/auth/sign-in/email`.
2.  **Session:** Better Auth verifies credentials and returns a session token.
3.  **Protection:** Protected routes use `middleware/authMiddleware.js` to verify the session using `auth.api.getSession`.
