require("dotenv").config();

const http = require("http");
const app = require("./src/app");
const connectDB = require("./src/config/db");
const { initializeSocket } = require("./src/config/socket");

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

initializeSocket(server);

const startServer = async () => {
    try {

        await connectDB();

        server.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
            
        });
        
    } catch (error) {
        console.error("Failed to start server:", error.message);
        process.exit(1);
    }
};

startServer();
