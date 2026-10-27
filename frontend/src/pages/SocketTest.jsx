import { useEffect, useRef, useState } from "react";
import { connectSocket } from "../services/socket";

function SocketTest() {
const [projectId, setProjectId] = useState("");
const [connected, setConnected] = useState(false);
const [status, setStatus] = useState("Not connected");
const [events, setEvents] = useState([]);
const socketRef = useRef(null);

const addEvent = (event) => {
    setEvents((previous) => [
        `${new Date().toLocaleTimeString()} — ${event}`,
        ...previous
    ]);
};

const handleConnect = () => {
    const token = localStorage.getItem("token");

    if (!token) {
        setStatus("Please log in first");
        return;
    }

    if (!/^[a-fA-F0-9]{24}$/.test(projectId.trim())) {
        setStatus("Enter a valid MongoDB project ID");
        return;
    }

    socketRef.current?.disconnect();

    const socket = connectSocket(token);
    socketRef.current = socket;

    socket.on("connect", () => {
        setConnected(true);
        setStatus("Connected. Joining project...");

        socket.emit("joinProject", projectId.trim(), (result) => {
            if (result?.success) {
                setStatus("Connected to project room");
            } else {
                setStatus(result?.message || "Could not join project");
            }
        });
    });

    socket.on("task:created", (data) => {
        addEvent(`Task created: ${data.task.title}`);
    });

    socket.on("task:updated", (data) => {
        addEvent(`Task updated: ${data.task.title}`);
    });

    socket.on("connect_error", (error) => {
        setConnected(false);
        setStatus(error.message);
    });

    socket.on("disconnect", () => {
        setConnected(false);
        setStatus("Disconnected");
    });
};

const handleDisconnect = () => {
    socketRef.current?.disconnect();
    socketRef.current = null;
    setConnected(false);
    setStatus("Disconnected");
};

useEffect(() => {
    return () => {
        socketRef.current?.disconnect();
    };
}, []);

return (
    <div style={{ padding: "24px", fontFamily: "Arial" }}>
        <h1>ProjectFlow — Socket Test</h1>

        <p>
            Connection: {connected ? "Connected" : "Not connected"}
        </p>

        <p>{status}</p>

        <input
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            placeholder="Enter Project ID"
            style={{ padding: "10px", width: "300px" }}
        />

        <button onClick={handleConnect} style={{ margin: "8px" }}>
            Connect to Project
        </button>

        <button onClick={handleDisconnect}>
            Disconnect
        </button>

        <h2>Live Events</h2>

        {events.length === 0 ? (
            <p>Waiting for task events...</p>
        ) : (
            <ul>
                {events.map((event, index) => (
                    <li key={`${event}-${index}`}>{event}</li>
                ))}
            </ul>
        )}
    </div>
);

}

export default SocketTest;
