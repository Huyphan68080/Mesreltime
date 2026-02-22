import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export const getSocket = (token: string): Socket => {
  if (socket) {
    return socket;
  }

  socket = io(process.env.NEXT_PUBLIC_SOCKET_URL ?? "http://localhost:4002", {
    transports: ["websocket", "polling"],
    withCredentials: true,
    auth: {
      token
    }
  });

  return socket;
};

export const closeSocket = (): void => {
  if (!socket) {
    return;
  }

  socket.disconnect();
  socket = null;
};
