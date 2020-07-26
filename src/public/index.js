const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");
const selectRoom = document.getElementById("selectRoom");
const consultingRoom = document.getElementById("consultingRoom");
const inputRoomNumber = document.getElementById("roomNumber");
const btnGoRoom = document.getElementById("goRoom");

let roomNumber, localStream, remoteStream, rtcPeerConnection, isCaller;
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

const socket = io();

btnGoRoom.onclick = function () {
  if (inputRoomNumber.value === "") {
    alert("please type a room name");
  } else {
    roomNumber = inputRoomNumber.value;
    console.log("Client : create or join ", roomNumber);
    socket.emit("create or join", roomNumber);
    consultingRoom.style = "display: block";
    selectRoom.style = "display: none";
  }
};

socket.on("created", async (room) => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia(streamConstraints);
    localStream = stream;
    localVideo.srcObject = stream;
    isCaller = true;
  } catch (error) {
    console.log("An Error occured while getUserMedia : ", error);
  }
});

socket.on("joined", async (room) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia(streamConstraints);
      localStream = stream;
      localVideo.srcObject = stream;
      socket.emit('ready', roomNumber);
    } catch (error) {
      console.log("An Error occured while getUserMedia : ", error);
    }
  });

socket.on('ready', async ()=>{
    try{
        if(isCaller){
            rtcPeerConnection = new RTCPeerConnection(iceServers);
            rtcPeerConnection.onicecandidate = onIceCandidate;
            rtcPeerConnection.ontrack = onAddStream;
            rtcPeerConnection.addTrack(localStream.getTracks()[0], localStream); // audio
            rtcPeerConnection.addTrack(localStream.getTracks()[1], localStream); // video
            const sessionDescription =  await rtcPeerConnection.createOffer();
            rtcPeerConnection.setLocalDescription(sessionDescription);
            socket.emit('offer', {
              type: 'offer',
              sdp: sessionDescription,
              room: roomNumber
            });
        }
    }catch(exception) {
      console.log("Exception : ", exception);
    }  
});

socket.on('offer', async (event)=>{
  try{
      if(!isCaller){
          rtcPeerConnection = new RTCPeerConnection(iceServers);
          rtcPeerConnection.onicecandidate = onIceCandidate;
          rtcPeerConnection.ontrack = onAddStream;
          rtcPeerConnection.addTrack(localStream.getTracks()[0], localStream); // audio
          rtcPeerConnection.addTrack(localStream.getTracks()[1], localStream); // video
          rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(event));
          const sessionDescription =  await rtcPeerConnection.createAnswer();
          rtcPeerConnection.setLocalDescription(sessionDescription);
          socket.emit('answer', {
            type: 'answer',
            sdp: sessionDescription,
            room: roomNumber
          });
      }
  }catch(exception) {
    console.log("Exception : ", exception);
  }  
});
