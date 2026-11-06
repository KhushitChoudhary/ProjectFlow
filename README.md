# 🚀 ProjectFlow – AI-Powered Team Project Management Platform

ProjectFlow is a full-stack project and team management application that helps teams organize workspaces, manage projects, assign tasks, collaborate in real time, and track project progress from a single platform.

It combines project management, team collaboration, notifications, and AI-powered task assistance to make teamwork more organized and productive.

🌐 **Live Demo:** https://project-flow-seven-flame.vercel.app  
🔗 **GitHub Repository:** https://github.com/KhushitChoudhary/ProjectFlow

---

## ✨ Features

### 🔐 1. Authentication & Authorization
- User registration and login
- JWT-based authentication
- Password hashing
- Protected routes and APIs
- Role-based access control

### 🏢 2. Workspace Management
- Create and manage workspaces
- Invite registered users through email
- Accept or reject workspace invitations
- Manage workspace members
- Role-based workspace permissions
- Organize projects within workspaces

### 📁 3. Project Management
- Create and manage projects
- Update project details
- Track project status
- Organize projects by workspace
- Project analytics and progress tracking

### ✅ 4. Task Management
- Create, update, and delete tasks
- Assign tasks to workspace members
- Reassign tasks when required
- Set task priorities:
  - LOW
  - MEDIUM
  - HIGH
  - URGENT
- Track task status:
  - TODO
  - IN_PROGRESS
  - IN_REVIEW
  - DONE
- Set task due dates
- Filter and manage tasks

### 💬 5. Task Comments
- Add comments to individual tasks
- View task-related discussions
- Display comment authors and timestamps
- Delete your own comments
- Keep task discussions organized in one place

### 📎 6. File Attachments
- Upload task-related attachments
- Access project and task attachments
- Download uploaded files
- Delete attachments

### 🔔 7. Notifications
- Task assignment notifications
- Workspace invitation notifications
- Real-time notification updates
- Track unread notifications
- Mark individual notifications as read
- Mark all notifications as read

### ⚡ 8. Real-Time Collaboration
- Socket.IO integration
- Real-time task updates
- Real-time project events
- Live notifications
- Real-time team communication

### 💬 9. Team Chat
- Team messaging
- Chat functionality
- Real-time communication using Socket.IO

### 🤖 10. AI Task Assistant
- AI-powered task assistance
- LLM integration
- AI support for task-related workflows

### 📊 11. Project Analytics
- Project progress tracking
- Task status insights
- Analytics dashboard

### 📰 12. Activity Feed
- Track project activities
- Monitor task-related changes
- View workspace activity history

### 🔎 13. Global Search
- Search across supported project and task resources
- Quickly navigate to relevant results

---

## 🛠️ Tech Stack

| Category | Technologies |
|---|---|
| Frontend | React.js, JavaScript, HTML5, CSS3 |
| Build Tool | Vite |
| Backend | Node.js, Express.js |
| Database | MongoDB |
| ODM | Mongoose |
| Authentication | JWT, bcryptjs |
| Real-Time | Socket.IO |
| API Communication | REST API, Axios |
| Charts | Recharts |
| AI Integration | OpenAI-compatible SDK / configured LLM provider |
| File Uploads | Multer |
| Deployment | Vercel, Render |
| Version Control | Git, GitHub |

---

## 📂 Project Structure

```text
ProjectFlow/
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   └── utils/
│   │
│   ├── uploads/
│   ├── server.js
│   ├── package.json
│   └── .env.example
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── services/
│   │   └── ...
│   │
│   ├── package.json
│   └── vite.config.js
│
└── README.md
```

---

## ⚙️ Installation & Setup

Follow these steps to run ProjectFlow locally.

### Prerequisites

Make sure you have installed:

- Node.js
- npm
- Git
- MongoDB or a MongoDB Atlas account

### 1. Clone the Repository

```bash
git clone https://github.com/KhushitChoudhary/ProjectFlow.git

cd ProjectFlow
```

### 2. Backend Setup

Navigate to the backend folder:

```bash
cd backend
```

Install dependencies:

```bash
npm install
```

### 3. Configure Backend Environment Variables

Create a `.env` file inside the `backend` directory.

Use the following configuration as a starting point:

```env
PORT=5000
NODE_ENV=development

MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret

FRONTEND_URL=http://localhost:5173

OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2
```

**Important:**
- Replace the MongoDB connection string with your own.
- Use a strong JWT secret.
- Keep API keys and credentials private.
- Never commit your `.env` file to GitHub.
- Configure additional variables if your email or AI service requires them.

### 4. Start the Backend

For development:

```bash
npm run dev
```

For production:

```bash
npm start
```

The backend runs on:

```text
http://localhost:5000
```

### 5. Frontend Setup

Open a new terminal and navigate to the frontend folder:

```bash
cd ProjectFlow/frontend
```

Install dependencies:

```bash
npm install
```

### 6. Configure Frontend Environment

Configure your frontend API and Socket.IO URLs according to the environment variable names used in the frontend source code.

For local development, the backend URL is:

```text
http://localhost:5000
```

### 7. Start the Frontend

```bash
npm run dev
```

Open the URL provided by Vite, usually:

```text
http://localhost:5173
```

---

## 🌍 Live Deployment

ProjectFlow is deployed using the following platforms:

| Component | Platform | URL |
|---|---|---|
| Frontend | Vercel | https://project-flow-seven-flame.vercel.app |
| Backend | Render | https://projectflow-vtfl.onrender.com |

**Note:** Some features require a registered and authenticated account. AI functionality also depends on the configured AI service being available.

---

## 🔒 Security Practices

- JWT-based authentication
- Password hashing
- Protected backend routes
- Workspace membership validation
- Role-based authorization
- Input validation
- Environment-based configuration
- Private API credentials

---

## 🚀 Future Improvements

- Advanced project analytics and reporting
- Enhanced AI-powered project planning
- Task dependency management
- Calendar integration
- GitHub integration
- Advanced team collaboration
- Automated testing
- Improved file storage and management
- Enhanced notification preferences

---

## 👨‍💻 Author

**Khushit Choudhary**

B.Tech Computer Science & Engineering Student

- GitHub: [KhushitChoudhary](https://github.com/KhushitChoudhary)

---

## ⭐ Show Your Support

If you like ProjectFlow, consider giving this repository a ⭐ on GitHub.

Suggestions, feedback, and contributions are welcome!

**Built with ❤️ using the MERN Stack.**
