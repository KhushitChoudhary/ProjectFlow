import { useCallback, useEffect, useRef, useState } from "react";
import { connectSocket } from "../services/socket";
import {
  getProjectMessages,
  sendProjectMessage,
} from "../services/messageApi";
import "./Chat.css";

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

function Chat() {
  const [projectId, setProjectId] = useState(
    localStorage.getItem("projectId") || ""
  );
  const [projectInput, setProjectInput] = useState(
    localStorage.getItem("projectId") || ""
  );
  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [socketConnected, setSocketConnected] = useState(false);

  const bottomRef = useRef(null);
  const socketRef = useRef(null);
  const currentUserId = localStorage.getItem("userId");

  const loadMessages = useCallback(async (id) => {
    if (!id?.trim()) {
      setError("Please enter a project ID.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setNotice("");

      const data = await getProjectMessages(id);

      setMessages(data.messages || []);
      setProjectId(id);
      setProjectInput(id);
      localStorage.setItem("projectId", id);
    } catch (err) {
      setMessages([]);
      setError(
        err.response?.data?.message || "Unable to load project messages."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const savedProjectId = localStorage.getItem("projectId");

    if (savedProjectId) {
      loadMessages(savedProjectId);
    }
  }, [loadMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);


useEffect(() => {
  if (!projectId) return;

  const token = localStorage.getItem("token");

  if (!token) {
    setError("Your session token was not found. Please log in again.");
    return;
  }

  const socket = connectSocket(token);
  socketRef.current = socket;

  let isActive = true;
  let joinedProject = false;

  const handleConnect = () => {
    setSocketConnected(true);
    setError("");

    socket.emit("joinProject", projectId, (response) => {
      if (!isActive) return;

      if (response?.success) {
        joinedProject = true;
        setNotice("");
      } else {
        joinedProject = false;
        setError(response?.message || "Unable to join the project chat.");
      }
    });
  };

  const handleDisconnect = (reason) => {
    console.log("Socket disconnected:", reason);
    setSocketConnected(false);
    joinedProject = false;
};

  const handleConnectError = (error) => {
    console.error("Socket connection error:", error.message);

    setSocketConnected(false);
    setError(error.message);
};

  const handleNewMessage = (message) => {
    if (!joinedProject) return;

    const messageProjectId =
      typeof message.project === "object"
        ? message.project?._id
        : message.project;

    if (
      messageProjectId &&
      String(messageProjectId) !== String(projectId)
    ) {
      return;
    }

    setMessages((previous) => {
      const alreadyExists = previous.some(
        (item) => item._id === message._id
      );

      return alreadyExists ? previous : [...previous, message];
    });
  };

  socket.on("connect", handleConnect);
  socket.on("disconnect", handleDisconnect);
  socket.on("connect_error", handleConnectError);
  socket.on("chat:newMessage", handleNewMessage);

  if (socket.connected) {
    handleConnect();
  }

  return () => {
    isActive = false;

    // The backend does not currently define a leave-project event.
    socket.off("connect", handleConnect);
    socket.off("disconnect", handleDisconnect);
    socket.off("connect_error", handleConnectError);
    socket.off("chat:newMessage", handleNewMessage);

    socket.disconnect();
    socketRef.current = null;
  };
}, [projectId]);


  const handleProjectSubmit = async (event) => {
    event.preventDefault();

    const id = projectInput.trim();

    if (!id) {
      setError("Please enter a project ID.");
      return;
    }

    await loadMessages(id);
  };

  const handleSend = async (event) => {
    event.preventDefault();

    const trimmedContent = content.trim();

    if (!projectId) {
      setError("Select a project before sending a message.");
      return;
    }

    if (!trimmedContent) return;

    if (trimmedContent.length > 2000) {
      setError("Messages cannot exceed 2000 characters.");
      return;
    }

    try {
      setSending(true);
      setError("");
      setNotice("");

      const data = await sendProjectMessage(projectId, trimmedContent);
      const sentMessage = data.chatMessage;

      if (sentMessage) {
        setMessages((previous) => {
          const alreadyExists = previous.some(
            (item) => item._id === sentMessage._id
          );

          return alreadyExists
            ? previous
            : [...previous, sentMessage];
        });
      }

      setContent("");
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to send your message."
      );
    } finally {
      setSending(false);
    }
  };

  const formatTime = (date) => {
    if (!date) return "";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) return "";

    return parsedDate.toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getSenderName = (message) => {
    if (message.sender?._id === currentUserId) return "You";

    return message.sender?.name || message.sender?.email || "Team member";
  };

  return (
    <main className="chat-page">
      <header className="chat-page-header">
        <div>
          <p className="chat-eyebrow">TEAM COLLABORATION</p>
          <h1>Project Chat</h1>
          <p className="chat-subtitle">
            Share updates and communicate with your project team.
          </p>
        </div>

        <div
          className={`chat-connection ${
            socketConnected ? "is-connected" : "is-disconnected"
          }`}
        >
          <span className="chat-connection-dot" />
          {socketConnected ? "Live updates connected" : "Live updates disconnected"}
        </div>
      </header>

      <form className="chat-project-selector" onSubmit={handleProjectSubmit}>
        <label htmlFor="chat-project-id">Project ID</label>

        <input
          id="chat-project-id"
          value={projectInput}
          onChange={(event) => setProjectInput(event.target.value)}
          placeholder="Enter the project ID"
          required
        />

        <button type="submit" disabled={loading}>
          {loading ? "Loading..." : "Open Chat"}
        </button>
      </form>

      {error && (
        <div className="chat-alert chat-alert-error" role="alert">
          {error}
        </div>
      )}

      {notice && (
        <div className="chat-alert" role="status">
          {notice}
        </div>
      )}

      <section className="chat-card">
        <div className="chat-card-header">
          <div className="chat-room-avatar">#</div>

          <div>
            <h2>Team Discussion</h2>
            <p>
              {projectId
                ? `Project ${projectId}`
                : "Select a project to start chatting"}
            </p>
          </div>

          <span className="chat-message-count">
            {messages.length} messages
          </span>
        </div>

        <div className="chat-messages">
          {!projectId ? (
            <div className="chat-empty-state">
              <div className="chat-empty-icon">#</div>
              <h3>Select a project</h3>
              <p>Enter a project ID above to view the team conversation.</p>
            </div>
          ) : loading ? (
            <div className="chat-empty-state">
              <p>Loading conversation...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="chat-empty-state">
              <div className="chat-empty-icon">✉</div>
              <h3>No messages yet</h3>
              <p>Start the conversation by sending the first message.</p>
            </div>
          ) : (
            messages.map((message) => {
              const isOwnMessage =
                message.sender?._id &&
                currentUserId &&
                String(message.sender._id) === String(currentUserId);

              return (
                <article
                  key={message._id}
                  className={`chat-message ${
                    isOwnMessage ? "own-message" : ""
                  }`}
                >
                  <div className="chat-message-avatar">
                    {(getSenderName(message).charAt(0) || "U").toUpperCase()}
                  </div>

                  <div className="chat-message-content">
                    <div className="chat-message-meta">
                      <strong>{getSenderName(message)}</strong>
                      <time>{formatTime(message.createdAt)}</time>
                    </div>

                    <div className="chat-message-bubble">
                      {message.content}
                    </div>
                  </div>
                </article>
              );
            })
          )}

          <div ref={bottomRef} />
        </div>

        <form className="chat-composer" onSubmit={handleSend}>
          <div className="chat-composer-input">
            <textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder={
                projectId
                  ? "Write a message to your team..."
                  : "Select a project first..."
              }
              maxLength={2000}
              rows={2}
              disabled={!projectId || sending}
              onKeyDown={(event) => {
                if (
                  event.key === "Enter" &&
                  !event.shiftKey &&
                  !event.nativeEvent.isComposing
                ) {
                  event.preventDefault();
                  event.currentTarget.form?.requestSubmit();
                }
              }}
            />

            <span>{content.length}/2000</span>
          </div>

          <button
            type="submit"
            disabled={!projectId || !content.trim() || sending}
          >
            {sending ? "Sending..." : "Send Message"}
            <span aria-hidden="true">➤</span>
          </button>
        </form>

        <p className="chat-composer-hint">
          Press Enter to send. Use Shift + Enter for a new line.
        </p>
      </section>
    </main>
  );
}

export default Chat;
