import {io} from "socket.io-client";

const SOCKET_URL = "http://localhost:5000";

export const connectSocket = (token) => {
    return io(SOCKET_URL, {
        auth: {token},
        autoConnect: true
    });
};