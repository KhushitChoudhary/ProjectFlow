const express = require('express');
const cors = require('cors');

const testRoutes = require('./routes/testRoutes');
const authRoutes = require('./routes/authRoutes');

const workspaceRoutes = require('./routes/workspaceRoutes')
const projectRoutes = require('./routes/projectRoutes');
const taskRoutes = require('./routes/taskRoutes');
const commentRoutes = require('./routes/commentRoutes');
const activityRoutes = require('./routes/activityRoutes');
const messageRoutes = require('./routes/messageRoutes');
const notificationRoutes = require("./routes/notificationRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const aiRoutes = require("./routes/aiRoutes");
const attachmentRoutes = require("./routes/attachmentRoutes");
const helmet = require("helmet");

const app = express();

const allowedOrigins = (
    process.env.FRONTEND_URL || "http://localhost:5173"
)
    .split(",")
    .map((url) => url.trim());

app.use(cors({
    origin: allowedOrigins,
    credentials: true
}));

app.disable("x-powered-by");

app.use(helmet());

app.use(express.json({
    limit: "100kb"
}));


app.use('/api', testRoutes);
app.use('/api', authRoutes);
app.use('/api', workspaceRoutes);
app.use('/api', projectRoutes);
app.use('/api', taskRoutes);
app.use('/api', commentRoutes);
app.use('/api', activityRoutes);
app.use('/api', messageRoutes);
app.use('/api', notificationRoutes);
app.use('/api', analyticsRoutes);
app.use('/api', aiRoutes);
app.use('/api', attachmentRoutes);

const { notFound, errorHandler } = require("./middleware/errorMiddleware");
app.use(notFound);
app.use(errorHandler);

app.get('/', (req, res) => {
    res.status(200).json({
        success: true,
        message: "ProjectFlow API is running"
    });
});

module.exports = app;