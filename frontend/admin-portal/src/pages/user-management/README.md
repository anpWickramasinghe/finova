# Backend API Requirements for User Management

Based on the analysis of the frontend code in `frontend/admin-portal/src/pages/user-management` and `frontend/admin-portal/src/components/user-management`, the following backend API endpoints are required.

## Base URL
`/api/v1` (Suggested)

## Users

### 1. Get All Users
Fetches a list of users with optional filtering.

- **Endpoint**: `GET /users`
- **Query Parameters**:
    - `search`: string (optional) - Search by name or email
    - `role`: string (optional) - Filter by role (Admin, Manager, Labour, Security)
    - `status`: string (optional) - Filter by status (Active, Inactive)
    - `branch`: string (optional) - Filter by branch
    - `page`: number (optional) - Pagination
    - `limit`: number (optional) - Pagination
- **Response**:
    ```json
    {
        "data": [
            {
                "id": 1,
                "name": "Sarah Johnson",
                "email": "sarah.j@finova.com",
                "role": "Admin",
                "branch": "Headquarters",
                "status": "Active",
                "avatar": "url_to_image",
                "lastActivity": "2024-03-10T10:15:00Z",
                "joinDate": "2024-01-15T00:00:00Z"
                // ... other fields
            }
        ],
        "meta": {
            "total": 100,
            "page": 1,
            "limit": 10
        }
    }
    ```

### 2. Get User Details
Fetches detailed information for a specific user.

- **Endpoint**: `GET /users/:id`
- **Response**:
    ```json
    {
        "id": 1,
        "name": "Sarah Johnson",
        "email": "sarah.j@finova.com",
        "phone": "+1 (555) 123-4567",
        "role": "Admin",
        "branch": "Headquarters",
        "nic": "123456789V",
        "address": "123 Main St, New York, NY 10001",
        "epfNo": "EPF001",
        "avatar": "url_to_image",
        "permissions": ["Full Access", "User Management"],
        "status": "Active",
        "joinDate": "2024-01-15T00:00:00Z",
        "lastActivity": "2024-03-10T10:15:00Z",
        "loginHistory": [
            { "date": "2024-03-10T09:00:00Z", "ip": "192.168.1.1", "device": "Chrome / Windows" }
        ],
        "activityLog": [
            { "action": "Updated system settings", "timestamp": "2024-03-10T10:15:00Z" }
        ]
    }
    ```

### 3. Create User
Creates a new user.

- **Endpoint**: `POST /users`
- **Content-Type**: `multipart/form-data` (if uploading image directly) or `application/json` (if image uploaded separately)
- **Body**:
    ```json
    {
        "name": "John Doe",
        "email": "john.d@finova.com",
        "phone": "+1 (555) 000-0000",
        "role": "Manager",
        "branch": "New York",
        "nic": "987654321V",
        "address": "456 Park Ave",
        "epfNo": "EPF002",
        "permissions": ["Transaction Management"],
        "status": "Active",
        "sendInvite": true,
        "avatar": "file_object_or_url"
    }
    ```
- **Response**: `201 Created` with created user object.

### 4. Update User
Updates an existing user's information.

- **Endpoint**: `PUT /users/:id`
- **Body**:
    ```json
    {
        "name": "John Doe Updated",
        "role": "Admin",
        // ... any other fields to update
    }
    ```
- **Response**: `200 OK` with updated user object.

### 5. Delete User
Deletes a user.

- **Endpoint**: `DELETE /users/:id`
- **Response**: `204 No Content`

### 6. Upload Avatar
Uploads a user avatar.

- **Endpoint**: `POST /upload/avatar`
- **Content-Type**: `multipart/form-data`
- **Body**: `file` (binary)
- **Response**:
    ```json
    {
        "url": "https://storage.finova.com/avatars/user_123.jpg"
    }
    ```

## Bulk Actions

### 7. Bulk Operations
Performs actions on multiple users.

- **Endpoint**: `POST /users/bulk-action`
- **Body**:
    ```json
    {
        "userIds": [1, 2, 3],
        "action": "delete" // or "email", "update_status", "update_role"
        // "data": { "status": "Inactive" } // optional data for update actions
    }
    ```
- **Response**: `200 OK` with summary of operations.

## Audit Logs

### 8. Get Audit Logs
Fetches system-wide audit logs.

- **Endpoint**: `GET /audit-logs`
- **Query Parameters**:
    - `page`, `limit`
    - `userId` (optional)
    - `action` (optional)
    - `startDate`, `endDate` (optional)
- **Response**:
    ```json
    {
        "data": [
            {
                "id": 101,
                "userId": 1,
                "userName": "Sarah Johnson",
                "userRole": "Admin",
                "action": "Updated system settings",
                "timestamp": "2024-03-10T10:15:00Z"
            }
        ],
        "meta": { "total": 500 }
    }
    ```
