const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const PORT = 3000;
let userList = new Map();
let activeUsers = 0;
const maxActiveUsers = 3;

const osc = require("osc");
const udpPort = new osc.UDPPort({
  localAddress: "0.0.0.0",
  localPort: 9000, // Change this to the port number you want to use
  remoteAddress: "127.0.0.1",
  remotePort: 57120, // Change this to the port number SuperCollider is listening on
});
udpPort.open();

app.use(express.static("public"));
app.get("/", (req, res) => {
  res.sendFile(__dirname + "index.html");
});

server.listen(PORT, () => {
  console.log(`listening on *:${PORT}`);
});

io.on("connection", (socket) => {
  userList.set(socket.id, { isActive: false, activeUserIndex: null });
  console.log(userList);

  socket.on("disconnect", () => {
    console.log("user disconnected");
    const user = userList.get(socket.id);
    if (user.isActive) {
      activeUsers--;
      udpPort.send({
        address: "/free",
        args: [
          {
            type: "i",
            value: user.activeUserIndex,
          },
        ],
      });
    }
    userList.delete(socket.id);
    console.log(userList);
    console.log(activeUsers);
  });

  socket.on("start", () => {
    if (activeUsers >= maxActiveUsers) {
      socket.emit("startRestricted");
    } else {
      const usersIndex = calcIndex();
      userList.set(socket.id, { isActive: true, activeUserIndex: usersIndex });
      activeUsers++;
      console.log(userList);
      console.log(activeUsers);
      socket.emit("start");
    }
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

function calcIndex() {
  const activeUsers = Array.from(userList.values()).filter(
    (user) => user.isActive
  );
  let usedIndexes = new Set(activeUsers.map((user) => user.activeUserIndex));

  let freeIndex = 0;
  while (usedIndexes.has(freeIndex)) {
    freeIndex++;
  }
  return freeIndex;
}
