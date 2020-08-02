const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");
const selectRoom = document.getElementById("selectRoom");
const consultingRoom = document.getElementById("consultingRoom");
const inputRoomNumber = document.getElementById("roomNumber");
const btnGoRoom = document.getElementById("goRoom");
const peerConnectionConfig = {
  iceServers: [
    { urls: "stun:stun.services.mozilla.com" },
    { urls: "stun:stun.l.google.com:19302" },
  ],
};

const streamConstraints = {
  audio: true,
  video: true,
};

let roomNumber, localStream, remoteStream, rtcPeerConnection, isCaller;

const socket = io();

async function getUserMediaStream() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia(streamConstraints);
    localStream = stream;
    localVideo.srcObject = stream;
  } catch (error) {
    console.log("An Error occured while getUserMedia : ", error);
    throw error;
  }
}

function createPeerConnection() {
  rtcPeerConnection = new RTCPeerConnection(peerConnectionConfig);
  rtcPeerConnection.onicecandidate = onIceCandidate;
  rtcPeerConnection.ontrack = onAddStream;
  rtcPeerConnection.addTrack(localStream.getTracks()[0], localStream); // audio
  rtcPeerConnection.addTrack(localStream.getTracks()[1], localStream); // video
}

function emitOfferOrAnswerEvent(eventType, sessionDescription, room) {
  socket.emit(eventType, {
    type: eventType,
    sdp: sessionDescription,
    room: room,
  });
};

function onAddStream(event) {
  console.log("Adding remote streams");
  remoteVideo.srcObject = event.streams[0];
  remoteStream = event.streams[0];
};

function onIceCandidate(event) {
  if (event.candidate) {
    console.log("sending ice candidate", event.candidate);
    // sending to signalling server
    socket.emit("candidate", {
      type: "candidate",
      label: event.candidate.sdpMLineIndex,
      id: event.candidate.sdpMid,
      candidate: event.candidate.candidate,
      room: roomNumber,
    });
  }
};

btnGoRoom.onclick = function () {
  if (inputRoomNumber.value === "") {
    console.log("No room Selected");
    alert("please type a room name");
  } else {
    roomNumber = inputRoomNumber.value;
    console.log("Client : create or join ", roomNumber);
    socket.emit("create or join", roomNumber);
    consultingRoom.style = "display: block";
    selectRoom.style = "display: none";
  }
};

// When a socket creates a room
socket.on("created", async (room) => {
  try {
    await getUserMediaStream();
    isCaller = true;
  } catch (error) {
    console.log("Created : An Error occurred while getUserMedia : ", error);
  }
});


// When a socket joins a room
socket.on("joined", async (room) => {
  try {
    await getUserMediaStream();
    socket.emit("ready", roomNumber);
  } catch (error) {
    console.log("Joined : An Error occurred while getUserMedia : ", error);
  }
});

// When a socket ready to interact
socket.on("ready", async () => {
  try {
    if (isCaller) {
      createPeerConnection();
      // Invoking createOffer method of rtcPeerConnection
      const sessionDescription = await rtcPeerConnection.createOffer();
      rtcPeerConnection.setLocalDescription(sessionDescription);
      emitOfferOrAnswerEvent("offer", sessionDescription, roomNumber);
    }
  } catch (exception) {
    console.log("Ready : Exception : ", exception);
  }
});

//  the user who recieves the request
socket.on("offer", async (event) => {
  try {
    if (!isCaller) {
      createPeerConnection();
      rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(event));
      // Invoking createAnswer method of rtcPeerConnection
      const sessionDescription = await rtcPeerConnection.createAnswer();
      rtcPeerConnection.setLocalDescription(sessionDescription);
      // sending it to the signalling server and then to the caller
      console.log("Emitted event for answer from client");
      emitOfferOrAnswerEvent("answer", sessionDescription, roomNumber);
    }
  } catch (exception) {
    console.log("Offer : Exception : ", exception);
  }
});

// recieved by the caller
socket.on("answer", (event) => {
  console.log("Event details recieved :", event);
  rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(event));
});

// recieving from the other peer
socket.on("candidate", (event) => {
  const candidate = new RTCIceCandidate({
    sdpMLineIndex: event.label,
    candidate: event.candidate,
  });
  // add Icecandidate to rtc connection
  rtcPeerConnection.addIceCandidate(candidate);
});


