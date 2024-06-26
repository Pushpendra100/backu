const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const cors = require("cors");
const matchRouter = require("./routes/match");
const { globalErrorHandler } = require("./controller/errorController");
const AppError = require("./utils/AppError");

// Create an instance of Express application
const app = express();
app.use(
  cors({
    
    origin: ["http://localhost:3000", "localhost", "https://www.chessplay.live"],
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE"],
    allowedHeaders: "Content-Type",
  })
); // Enable CORS for Express.js
app.use(express.json());
app.use("/api/v1/match", matchRouter);

// Create an HTTP server using the Express app
const appServer = http.createServer(app);

// Create a socket.io server and configure CORS settings
const io = socketIO(appServer, {
  cors: {
    origin: ["http://localhost:3000", "localhost", "https://www.chessplay.live"],
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE"],
    transports: ['websocket', 'polling'],
    credentials: true
  },
  allowEIO3: true
});

// "Origin",
// "X-Requested",
// "Accept Authorization",

// Socket.io event listeners
io.on("connection", (socket) => {
  // Handle connection request from player
  socket.on("connection-req-from-player", (matchId, address) => {
    socket.to(matchId).emit("connection-req-from-player", matchId, address);
  });

  // Handle accepted connection request
  socket.on(
    "connection-req-accepted",
    (matchId, address, connectionReqAccepted) => {
      socket.to(matchId).emit("connection-req-accepted", matchId, address);
      connectionReqAccepted();
    }
  );

  // Handle chess piece movement
  socket.on("chess-piece-moved", (matchId, moveData) => {
    socket.to(matchId).emit("chess-piece-moved", matchId, moveData);
  });

  // Handle joining a match
  socket.on("join-match", (matchId, connectWithOpponent) => {
    socket.join(matchId);
    connectWithOpponent();
  });
});

// Middleware to handle undefined routes
app.all("*", (req, res, next) => {
  next(new AppError(`this ${req.originalUrl} route not defined`, 404));
});

// Global error handler middleware
app.use(globalErrorHandler);

// Export the created app server
module.exports = appServer;
