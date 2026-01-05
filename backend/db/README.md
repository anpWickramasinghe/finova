# Database Schema Documentation

This directory contains the database schema definitions for the application, using Drizzle ORM.

## Schema Overview

The database consists of the following main tables:
- **user**: Stores user information including authentication details, profile data, and permissions.
- **session**: Manages user sessions.
- **account**: Handles OAuth accounts and linkage to users.
- **verification**: Stores verification tokens for email/phone verification.
- **branch**: Stores branch information.

## Entity Relationship Diagram

```mermaid
erDiagram
    user ||--o{ session : "has"
    user ||--o{ account : "has"
    branch ||--o{ user : "has"

    user {
        text id PK
        text name
        text email
        boolean emailVerified
        text image
        timestamp createdAt
        timestamp updatedAt
        text role
        text companyId
        boolean requiresPasswordChange
        text phone
        text branchId FK
        text nic
        text address
        text epfNo
        text status
        text permissions
    }

    session {
        text id PK
        timestamp expiresAt
        text token
        timestamp createdAt
        timestamp updatedAt
        text ipAddress
        text userAgent
        text userId FK
    }

    account {
        text id PK
        text accountId
        text providerId
        text userId FK
        text accessToken
        text refreshToken
        text idToken
        timestamp accessTokenExpiresAt
        timestamp refreshTokenExpiresAt
        text scope
        text password
        timestamp createdAt
        timestamp updatedAt
    }

    verification {
        text id PK
        text identifier
        text value
        timestamp expiresAt
        timestamp createdAt
        timestamp updatedAt
    }

    branch {
        text id PK
        text name
        text manager
        text contactNumber
        text employeeCount
        text revenue
        timestamp lastAudit
        timestamp createdAt
        timestamp updatedAt
    }
```

## Files
- `schema.ts`: The Drizzle ORM schema definition file.
