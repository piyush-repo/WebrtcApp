const express = require("express");
const app = express();
const http = require("http").createServer(app);
const port = process.env.PORT || 3030;
const io = require("socket.io")(http);
const path = require("path");

app.use(express.static(path.resolve("..", "public")));

app.get("/", (req, res) => {
  res.sendFile("index.html");
});

io.on("connection", (socket) => {
  console.log("Socket got connected");
  console.log("connection : Socket Details");

  socket.on("create or join", (room) => {
    console.log("Server : create or join to room: ", room);
    const myRoom = io.sockets.adapter.rooms[room] || { length: 0 };
    const numClients = myRoom.length;
    console.log(`${room} has ${numClients} clients`);

    if (!numClients) {
      socket.join(room);
      socket.emit("created", room);
    } else if (numClients === 1) {
      socket.join(room);
      socket.emit("joined", room);
    } else {
      socket.emit("full", room);
    }
  });

  socket.on("ready", (room) => {
    socket.broadcast.to(room).emit("ready");
  });

  socket.on("candidate", (event) => {
    socket.broadcast.to(event.room).emit("offer", event.sdp);
  });

  socket.on("answer", (event) => {
    socket.broadcast.to(event.room).emit("answer", event.sdp);
  });

  socket.on("disconnect", (socket) => {
    console.log("Socket got disconnected");
    console.log("disconnection : Socket Details");
  });
});

http.listen(port, () => {
  console.log(`Application started on port ${port}`);
});
