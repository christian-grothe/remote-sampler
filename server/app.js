const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const PORT = 3000;
const maxActiveUsers = 3;

let userList = new Map();
let queue = new Array();

const osc = require("osc");
const udpPort = new osc.UDPPort({
  localAddress: "0.0.0.0",
  localPort: 9000, // Change this to the port number you want to use
  remoteAddress: "127.0.0.1",
  remotePort: 57120, // Change this to the port number SuperCollider is listening on
});
udpPort.open();

// Serve App
app.use(express.static("public"));
app.get("/", (req, res) => {
  res.sendFile(__dirname + "index.html");
});

server.listen(PORT, () => {
  console.log(`listening on *:${PORT}`);
});

// IO Connections
io.on("connection", (socket) => {
  // init socket
  const initData = {
    queueLength: queue.length,
    activeUsers: userList.size,
    maxActiveUsers,
  };
  socket.join("remote-synth");
  socket.emit("init", initData);

  socket.on("disconnect", () => {
    console.log("user disconnected");
    removeActiveUser(socket);
    removeUserFromCueue(socket);
  });

  socket.on("start", () => {
    if (userList.size >= maxActiveUsers) {
      addUserToCueue(socket);
    } else {
      activateUser(socket.id);
    }
  });

  socket.on("exit", () => {
    console.log("user exits");
    deactivatUser(socket);
    fromQueueToActive();
  });

  socket.on("exit-queue", () => {
    removeUserFromCueue(socket);
  });

  socket.on("rec", () => {
    const user = userList.get(socket.id);
    udpPort.send({
      address: "/rec",
      args: [
        {
          type: "i",
          value: user.activeUserIndex,
        },
      ],
    });
  });

  socket.on("touchstart", () => {
    const user = userList.get(socket.id);
    udpPort.send({
      address: "/start",
      args: [
        {
          type: "i",
          value: user.activeUserIndex,
        },
      ],
    });
  });

  socket.on("touchend", () => {
    const user = userList.get(socket.id);
    udpPort.send({
      address: "/stop",
      args: [
        {
          type: "i",
          value: user.activeUserIndex,
        },
      ],
    });
  });

  socket.on("data", (data) => {
    const user = userList.get(socket.id);
    udpPort.send({
      address: "/data",
      args: [
        {
          type: "f",
          value: data.x,
        },
        {
          type: "f",
          value: data.y,
        },
        {
          type: "f",
          value: data.sliderData[0],
        },
        {
          type: "f",
          value: data.sliderData[1],
        },
        {
          type: "f",
          value: data.sliderData[2],
        },
        {
          type: "f",
          value: data.sliderData[3],
        },
        {
          type: "f",
          value: data.sliderData[4],
        },
        {
          type: "i",
          value: user.activeUserIndex,
        },
      ],
    });
  });
});

// Functions
function calcIndex() {
  const vals = Array.from(userList.values());
  let freeIndex = 0;
  vals.forEach((val) => {
    if (freeIndex !== val.activeUserIndex) return;
    freeIndex++;
  });
  return freeIndex;
}

function removeActiveUser(socket) {
  console.log("remove Active User");
  const user = userList.get(socket.id);
  if (user) {
    userList.delete(socket.id);
    console.log(userList);
    fromQueueToActive();
  }
}

function deactivatUser(socket) {
  console.log("deactivate User");
  const user = userList.get(socket.id);
  if (user) {
    userList.delete(socket.id);
    io.to("remote-synth").emit("active-users", userList.size);
  }
}

function addUserToCueue(socket) {
  console.log("add user to queue");
  queue.push(socket.id);
  console.log(queue);
  updateQueueData();
}

function removeUserFromCueue(socket) {
  console.log("remove user from queue");
  const index = queue.indexOf(socket.id);
  if (index > -1) {
    queue.splice(index, 1);
    console.log(queue);
    updateQueueData();
  }
}

function fromQueueToActive() {
  console.log("from queue to active");
  if (queue.length > 0) {
    const userId = queue.shift();
    updateQueueData();
    activateUser(userId);
  }
}

function activateUser(id) {
  console.log("activate user");

  const socket = io.sockets.sockets.get(id);
  const usersIndex = calcIndex();

  userList.set(id, {
    activeUserIndex: usersIndex,
  });

  console.log(userList);
  socket.emit("start");
  io.to("remote-synth").emit("active-users", userList.size);
}

function updateQueueData() {
  console.log("update queue data");

  io.to("remote-synth").emit("queue-length", queue.length);

  queue.forEach((id, i) => {
    const socket = io.sockets.sockets.get(id);
    socket.emit("queue-pos", i + 1);
  });
}
