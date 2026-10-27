# ProjectFlow – Full Stack Project Management Application

ProjectFlow is a full-stack project management application designed to help teams organize projects, manage tasks, collaborate efficiently, and track progress in one place.

## Features

- **User Authentication:** Secure registration and login using JWT and password hashing.
- **Workspace Management:** Create and manage workspaces with role-based access control.
- **Project Management:** Create and organize projects within workspaces.
- **Task Management:** Create, update, and delete tasks while tracking their status.
- **Role-Based Authorization:** Control access to workspace and project operations based on user roles.
- **Real-Time Communication:** Socket.IO integration for real-time project events.
- **Notifications:** View notifications, track unread counts, and mark notifications as read.
- **REST APIs:** Backend APIs for authentication, workspaces, projects, tasks, and notifications.
- **Responsive Frontend:** React-based user interface.

## Tech Stack

**Frontend**
- React.js
- Vite
- JavaScript
- HTML5
- CSS3

**Backend**
- Node.js
- Express.js
- REST APIs
- Socket.IO
- JWT Authentication
- bcrypt / password hashing

**Database**
- MongoDB
- Mongoose

**Tools**
- Git
- GitHub
- VS Code
- npm

## Project Structure

```text
ProjectFlow/
├── backend/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── server.js
│   └── package.json
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── vite.config.js
│
├── .gitignore
└── README.md
```

*Note: The folder structure may vary slightly depending on the implementation.*

## Getting Started

### Prerequisites

Make sure you have installed:

- Node.js and npm
- MongoDB or a MongoDB Atlas account
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/KhushitChoudhary/ProjectFlow.git
cd ProjectFlow
```

### 2. Set Up the Backend

```bash
cd backend
npm install
