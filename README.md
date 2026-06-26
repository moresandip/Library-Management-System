# Library Management System - RESTful Backend

A Node.js + Express.js backend RESTful API for a Library Management System. The system supports role-based authentication and authorization with two roles:
*   **Librarian**: Manages the library inventory (Book CRUD) and members list.
*   **Member**: Views available books, borrows, and returns books.

---

## 🛠 Tech Stack

*   **Runtime System**: Node.js (v18+)
*   **Web Framework**: Express.js
*   **Database**: MongoDB (configured via Mongoose Object Modeling)
*   **Authentication**: JSON Web Token (JWT)
*   **Password Hashing**: bcryptjs
*   **Request Validation**: express-validator

---

## 📁 Project Structure

```
library-management-system/
├── config/
│   └── db.js                  # MongoDB Mongoose connection
├── controllers/
│   ├── authController.js      # Auth logic (Register & Login)
│   ├── bookController.js      # Books management (CRUD, borrow, return)
│   └── memberController.js    # Members list & history
├── middleware/
│   ├── authMiddleware.js      # JWT token extraction & verification
│   ├── roleMiddleware.js      # Role-based access control
│   └── errorMiddleware.js     # Centralized error handler & status mapper
├── models/
│   ├── User.js                # User schemas & password hashing hooks
│   ├── Book.js                # Book inventory schemas & constraint rules
│   └── Borrow.js              # Borrow transaction records
├── routes/
│   ├── authRoutes.js          # Authentication routing
│   ├── bookRoutes.js          # Books routing
│   └── memberRoutes.js        # Members routing
├── validators/
│   └── validationRules.js     # Fields checks (length, formats, integers)
├── .env                       # Environment configuration (local only)
├── .env.example               # Env configuration template
├── server.js                  # Express server entry point
├── seedLibrarian.js           # Script to bootstrap initial Librarian
└── package.json               # Dependencies and scripts
```

---

## ⚙️ Installation & Setup

### Prerequisites
1.  **Node.js**: Ensure Node.js (v18+) is installed.
2.  **MongoDB**: Ensure MongoDB is running locally or prepare a MongoDB Atlas connection string.

### Setup Instructions
1.  Clone/Extract the project directory.
2.  Open the terminal in the project directory and install the dependencies:
    ```bash
    npm install
    ```
3.  Set up environment variables:
    *   Create a `.env` file in the root directory (based on `.env.example`).
    *   Example configuration:
        ```env
        PORT=5000
        DATABASE_URL=mongodb://localhost:27017/library
        JWT_SECRET=super_secret_library_management_jwt_key
        JWT_EXPIRES_IN=1d
        ```

### Database Seeding
Librarian accounts cannot be registered via public signup. Registering through the public signup API automatically forces the `member` role.
To create the initial Librarian account, run the database seed script:
```bash
npm run seed:librarian
```
*   **Default Librarian Credentials**:
    *   **Email**: `librarian@library.com`
    *   **Password**: `librarian123`

### Running the Server
*   To run in **development mode** (with hot-reload via nodemon):
    ```bash
    npm run dev
    ```
*   To run in **production mode**:
    ```bash
    npm start
    ```

---

## 📖 API Documentation

All routes (except `/api/auth/*`) require a Bearer token in the `Authorization` header:
`Authorization: Bearer <JWT_TOKEN>`

### 1. Authentication

#### Register Member
*   **Endpoint**: `POST /api/auth/register`
*   **Access**: Public
*   **Description**: Registers a new user. Registers as a `member` only.
*   **Request Body**:
    ```json
    {
      "name": "Rohith Kumar",
      "email": "rohith@markanthony.com",
      "password": "password123"
    }
    ```
*   **Success Response (201 Created)**:
    ```json
    {
      "success": true,
      "message": "User registered successfully.",
      "data": {
        "id": "649c305a415a770014b2eb1e",
        "name": "Rohith Kumar",
        "email": "rohith@markanthony.com",
        "role": "member"
      }
    }
    ```

#### Login User
*   **Endpoint**: `POST /api/auth/login`
*   **Access**: Public
*   **Description**: Verifies credentials and returns a JWT token.
*   **Request Body**:
    ```json
    {
      "email": "rohith@markanthony.com",
      "password": "password123"
    }
    ```
*   **Success Response (200 OK)**:
    ```json
    {
      "success": true,
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "user": {
        "id": "649c305a415a770014b2eb1e",
        "name": "Rohith Kumar",
        "email": "rohith@markanthony.com",
        "role": "member"
      }
    }
    ```

---

### 2. Librarian Features

#### Get All Members
*   **Endpoint**: `GET /api/members`
*   **Access**: Private (Librarian only)
*   **Description**: Retrieves a list of all registered member accounts.
*   **Success Response (200 OK)**:
    ```json
    {
      "success": true,
      "count": 1,
      "data": [
        {
          "_id": "649c305a415a770014b2eb1e",
          "name": "Rohith Kumar",
          "email": "rohith@markanthony.com",
          "role": "member",
          "createdAt": "2026-06-25T12:00:00.000Z",
          "updatedAt": "2026-06-25T12:00:00.000Z"
        }
      ]
    }
    ```

#### Delete Member
*   **Endpoint**: `DELETE /api/members/:id`
*   **Access**: Private (Librarian only)
*   **Description**: Deletes a member account. Checks if they have any active borrows (deletion is blocked until they return all books).
*   **Success Response (200 OK)**:
    ```json
    {
      "success": true,
      "message": "Member deleted successfully."
    }
    ```

#### Add Book
*   **Endpoint**: `POST /api/books`
*   **Access**: Private (Librarian only)
*   **Description**: Adds a new book to the library inventory. Sets initial `availableQuantity` equal to `quantity`.
*   **Request Body**:
    ```json
    {
      "title": "Eloquent JavaScript",
      "author": "Marijn Haverbeke",
      "isbn": "9781593279509",
      "category": "Programming",
      "quantity": 5
    }
    ```
*   **Success Response (201 Created)**:
    ```json
    {
      "success": true,
      "message": "Book added successfully.",
      "data": {
        "_id": "649c314a415a770014b2eb22",
        "title": "Eloquent JavaScript",
        "author": "Marijn Haverbeke",
        "isbn": "9781593279509",
        "category": "Programming",
        "quantity": 5,
        "availableQuantity": 5,
        "createdAt": "2026-06-25T12:10:00.000Z",
        "updatedAt": "2026-06-25T12:10:00.000Z"
      }
    }
    ```

#### Update Book
*   **Endpoint**: `PUT /api/books/:id`
*   **Access**: Private (Librarian only)
*   **Description**: Updates details of an existing book. If `quantity` is modified, it adjusts `availableQuantity` ensuring it does not drop below currently borrowed copies.
*   **Request Body** (All fields optional):
    ```json
    {
      "quantity": 6
    }
    ```
*   **Success Response (200 OK)**:
    ```json
    {
      "success": true,
      "message": "Book updated successfully.",
      "data": {
        "_id": "649c314a415a770014b2eb22",
        "title": "Eloquent JavaScript",
        "author": "Marijn Haverbeke",
        "isbn": "9781593279509",
        "category": "Programming",
        "quantity": 6,
        "availableQuantity": 6,
        "createdAt": "2026-06-25T12:10:00.000Z",
        "updatedAt": "2026-06-25T12:15:00.000Z"
      }
    }
    ```

#### Delete Book
*   **Endpoint**: `DELETE /api/books/:id`
*   **Access**: Private (Librarian only)
*   **Description**: Deletes a book from the library. Deletion is blocked if any copies are currently borrowed.
*   **Success Response (200 OK)**:
    ```json
    {
      "success": true,
      "message": "Book deleted successfully."
    }
    ```

---

### 3. Member Features

#### View Available Books
*   **Endpoint**: `GET /api/books`
*   **Access**: Private (All Authenticated users)
*   **Description**: Returns a paginated list of books, supports query filters and search terms.
*   **Query Parameters** (All optional):
    *   `page`: Page number (default: `1`)
    *   `limit`: Items per page (default: `10`)
    *   `search`: Searches title or author (case-insensitive regex match)
    *   `category`: Category exact filter (case-insensitive match)
*   **Success Response (200 OK)**:
    ```json
    {
      "success": true,
      "count": 1,
      "totalBooks": 1,
      "totalPages": 1,
      "currentPage": 1,
      "data": [
        {
          "_id": "649c314a415a770014b2eb22",
          "title": "Eloquent JavaScript",
          "author": "Marijn Haverbeke",
          "isbn": "9781593279509",
          "category": "Programming",
          "quantity": 6,
          "availableQuantity": 6,
          "createdAt": "2026-06-25T12:10:00.000Z",
          "updatedAt": "2026-06-25T12:15:00.000Z"
        }
      ]
    }
    ```

#### Get Book Details
*   **Endpoint**: `GET /api/books/:id`
*   **Access**: Private (All Authenticated users)
*   **Description**: Retrieves full details of a specific book.
*   **Success Response (200 OK)**:
    ```json
    {
      "success": true,
      "data": {
        "_id": "649c314a415a770014b2eb22",
        "title": "Eloquent JavaScript",
        "author": "Marijn Haverbeke",
        "isbn": "9781593279509",
        "category": "Programming",
        "quantity": 6,
        "availableQuantity": 6,
        "createdAt": "2026-06-25T12:10:00.000Z",
        "updatedAt": "2026-06-25T12:15:00.000Z"
      }
    }
    ```

#### Borrow Book
*   **Endpoint**: `POST /api/books/:id/borrow`
*   **Access**: Private (Member only)
*   **Description**: Borrows a copy of the book. Decrements `availableQuantity` by 1.
*   **Borrowing Conditions**:
    1.  Book must be available (`availableQuantity > 0`).
    2.  The member cannot borrow the same book twice without returning it first.
*   **Success Response (200 OK)**:
    ```json
    {
      "success": true,
      "message": "Book borrowed successfully."
    }
    ```

#### Return Book
*   **Endpoint**: `POST /api/books/:id/return`
*   **Access**: Private (Member only)
*   **Description**: Returns a borrowed book. Increments `availableQuantity` by 1.
*   **Returning Conditions**:
    1.  Member can only return books they have active borrow records for.
*   **Success Response (200 OK)**:
    ```json
    {
      "success": true,
      "message": "Book returned successfully."
    }
    ```

#### My Borrowed Books
*   **Endpoint**: `GET /api/members/me/books`
*   **Access**: Private (Member only)
*   **Description**: Returns a list of books currently borrowed by the authenticated member.
*   **Success Response (200 OK)**:
    ```json
    {
      "success": true,
      "count": 1,
      "data": [
        {
          "borrowId": "649c325a415a770014b2eb30",
          "borrowDate": "2026-06-25T12:20:00.000Z",
          "status": "borrowed",
          "book": {
            "id": "649c314a415a770014b2eb22",
            "title": "Eloquent JavaScript",
            "author": "Marijn Haverbeke",
            "isbn": "9781593279509",
            "category": "Programming"
          }
        }
      ]
    }
    ```

---

## ⚠️ Error Handling Format

All error responses adhere to the standard JSON format with appropriate HTTP Status codes:
```json
{
  "success": false,
  "message": "Detailed error message describing what went wrong."
}
```
*   **400 Bad Request**: Input validation failed, negative quantities, duplicate ISBN/emails, invalid Mongo ID formats, borrowing constraints, or invalid state actions.
*   **401 Unauthorized**: Missing token or invalid/expired token.
*   **403 Forbidden**: Role restriction violations (e.g., members trying to add books, or librarians trying to borrow books).
*   **404 Not Found**: Book, member, or endpoint resource not found.
*   **500 Internal Server Error**: Unhandled server exceptions.
#   L i b r a r y - M a n a g e m e n t - S y s t e m  
 