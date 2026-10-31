import {io} from "socket.io-client";

const SOCKET_URL = "https://projectflow-vtfl.onrender.com";

export const connectSocket = (token) => {
    return io(SOCKET_URL, {
        auth: {token},
        autoConnect: true
    });
};