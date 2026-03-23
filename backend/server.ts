import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";

import attendanceRoutes from "./routes/attendanceRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import branchRoutes from "./routes/branchRoutes.js";
import leaveRoutes from "./routes/leaveRoutes.js";
import payrollRoutes from "./routes/payrollRoutes.js";
import transactionRoutes from "./routes/transactionRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import stripeRoutes from "./routes/stripeRoutes.js";

import { auth } from "./auth.js";
import path from "path";
import { toNodeHandler } from "better-auth/node";
import { setupChatSocket } from "./sockets/chatSockets.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Setup sockets
setupChatSocket(io);

app.use(cors());

// Mount Better Auth handler BEFORE express.json()
app.all("/api/auth/*splat", toNodeHandler(auth));

app.use(express.json());

app.use("/api/admin", adminRoutes);
app.use("/api/branches", branchRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/leaves", leaveRoutes);
app.use("/api/payroll", payrollRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/stripe", stripeRoutes);

// Serve uploads statically
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.get("/", (req, res) => {
  res.send("Finova API is running");
});

httpServer.listen(PORT, () => {
  console.log(`Server & Socket.io running on port ${PORT}`);
});
