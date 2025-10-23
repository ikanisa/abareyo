// Only used if you still need socket.io in this view. Forces polling on managed hosts.
import { io } from "socket.io-client";
const transports = [process.env.NEXT_PUBLIC_SOCKET_TRANSPORT || "polling", "websocket"];
export const socket = io("", { path: "/socket.io", transports });

