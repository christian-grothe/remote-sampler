const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const PORT = 3000;
const maxActiveUsers = 3;
const sliderNum = 5;

let userList = new Map();
let queue = new Array();

const osc = require("osc");
const udpPort = new osc.UDPPort({
  localAddress: "0.0.0.0",
  localPort: 9000, // Change this to the port number you want to use
  remoteAddress: "127.0.0.1", // Change this to remote Address of SuperCollider
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
    removeActiveUser(socket);
  });

  socket.on("debug", (data) => {
    console.log(data);
  });

  socket.on("exit-queue", () => {
    removeUserFromCueue(socket);
  });

  socket.on("rec", () => {
    const user = userList.get(socket.id);
    if (!user) return;
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

  socket.on("touchstart", (data) => {
    console.log(data);
    const user = userList.get(socket.id);
    if (!user) return;
    // udpPort.send({
    //   address: "/start",
    //   args: [
    //     {
    //       type: "f",
    //       value: data.x,
    //     },
    //     {
    //       type: "f",
    //       value: data.y,
    //     },
    //     {
    //       type: "f",
    //       value: data.sliderData[0],
    //     },
    //     {
    //       type: "f",
    //       value: data.sliderData[1],
    //     },
    //     {
    //       type: "f",
    //       value: data.sliderData[2],
    //     },
    //     {
    //       type: "f",
    //       value: data.sliderData[3],
    //     },
    //     {
    //       type: "f",
    //       value: data.sliderData[4],
    //     },
    //     {
    //       type: "i",
    //       value: user.activeUserIndex,
    //     },
    //   ],
    // });
  });

  socket.on("touchend", (data) => {
    const user = userList.get(socket.id);
    //console.log(data);
    if (!user) return;
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

  // send controller data to super collider
  socket.on("controllerData", (data) => {
    console.log(data);
    const user = userList.get(socket.id);
    if (!user) return;
    //console.log(data);
    // udpPort.send({
    //   address: "/controller",
    //   args: [
    //     {
    //       type: "f",
    //       value: data.x,
    //     },
    //     {
    //       type: "f",
    //       value: data.y,
    //     },
    //     {
    //       type: "i",
    //       value: user.activeUserIndex,
    //     },
    //   ],
    // });
  });

  // send slider data to super collider
  for (let i = 0; i < sliderNum; i++) {
    socket.on(`sliderData${i}`, (data) => {
      console.log(data);
      const user = userList.get(socket.id);
      if (!user) return;
      udpPort.send({
        address: `/slider${i}`,
        args: [
          {
            type: "f",
            value: data,
          },
          {
            type: "i",
            value: user.activeUserIndex,
          },
        ],
      });
    });
  }
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
  const user = userList.get(socket.id);
  if (!user) return;
  udpPort.send({
    address: "/stop",
    args: [
      {
        type: "i",
        value: user.activeUserIndex,
      },
    ],
  });
  userList.delete(socket.id);
  io.to("remote-synth").emit("active-users", userList.size);
  fromQueueToActive();
}

function addUserToCueue(socket) {
  queue.push(socket.id);
  updateQueueData();
}

function removeUserFromCueue(socket) {
  const index = queue.indexOf(socket.id);
  if (index > -1) {
    queue.splice(index, 1);
    updateQueueData();
  }
}

function fromQueueToActive() {
  if (queue.length > 0) {
    const userId = queue.shift();
    updateQueueData();
    activateUser(userId);
  }
}

function activateUser(id) {
  const socket = io.sockets.sockets.get(id);
  const usersIndex = calcIndex();

  userList.set(id, {
    activeUserIndex: usersIndex,
  });
  socket.emit("start");
  io.to("remote-synth").emit("active-users", userList.size);
}

function updateQueueData() {
  io.to("remote-synth").emit("queue-length", queue.length);

  queue.forEach((id, i) => {
    const socket = io.sockets.sockets.get(id);
    socket.emit("queue-pos", i + 1);
  });
}
