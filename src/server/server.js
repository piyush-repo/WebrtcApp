const express = require("express");
const app = express();
const http = require("http").createServer(app);
const port = process.env.PORT || 3030;
const io = require("socket.io")(http);
const path = require("path");
const event = require('./events/event');

// static files middleware
app.use(express.static(path.resolve("..", "public")));

// returning the index html file
app.get("/", (req, res) => {
  res.sendFile("index.html");
});

// Signalling 
io.on("connection", (socket) => {
  console.log("Socket got connected");

  socket.on("create or join", (room) => {
    event.createOrJoin(io, socket, room);
  });

  socket.on("ready", (room) => {
    event.ready(socket, room);
  });

  socket.on("candidate", (eventObj) => {
    event.candidate(socket, eventObj);
  });

  socket.on("offer", (eventObj)=>{
    event.offer(socket, eventObj);
  });
  
  socket.on("answer", (eventObj) => {
    event.answer(socket, eventObj);
  });

  socket.on("disconnect", (socket) => {
    console.log("Socket got disconnected : ", socket.id);
    console.log("disconnection : Socket Details");
  });
});

http.listen(port, () => {
  console.log(`Application started on port ${port}`);
});
