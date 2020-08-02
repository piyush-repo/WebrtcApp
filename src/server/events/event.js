module.exports = {
  createOrJoin: (io, socket, room) => {
    console.log("Server : create or join to room: ", room);
    const numClientsInRoom = io.sockets.adapter.rooms[room] || { length: 0 };
    console.log(`${room} has ${numClientsInRoom.length} clients`);
    if (!numClientsInRoom.length) {
      socket.join(room);
      console.log("created socket : ", socket.id);
      socket.emit("created", room);
    } else if (numClientsInRoom.length === 1) {
      socket.join(room);
      console.log("joined socket : ", socket.id);
      socket.emit("joined", room);
    } else {
      socket.emit("full", room);
    }
  },
  ready : (socket, room) => {
    console.log("Ready : Sending the event when the peer is ready");
    socket.broadcast.to(room).emit("ready");
  },
  candidate : (socket, event)=> {
    console.log("Candidate : Sending the candidate information");
    socket.broadcast.to(event.room).emit("candidate", event);
  },
  offer : (socket, event) => {
    console.log("Recieved offer from client: ");
    console.log("Offer : Sending the session Description");
    socket.broadcast.to(event.room).emit("offer", event.sdp);
  },
  answer: (socket, event) => {
    console.log('Received event for answer from client ', event);
    console.log("Answer : Sending the session Description");
    socket.broadcast.to(event.room).emit("answer", event.sdp);
  }
};
