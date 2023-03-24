import { Controller } from "./classes/controller.js";
import { Slider } from "./classes/slider.js";

window.onload = function () {
  const socket = io();

  const rec = document.getElementById("rec");
  const controll = document.getElementById("controll");
  const rect = controll.getBoundingClientRect();
  const sliderElements = Array.from(document.querySelectorAll(".slider"));
  const controllIndicator = document.getElementById("controll-indicator");
  const wrapper = document.getElementById("wrapper");
  const exitButton = document.getElementById("exit");

  const overlay = document.getElementById("overlay");
  const startButton = document.getElementById("start");
  const exitQueueButton = document.getElementById("exit-queue");
  const activeUsers = document.getElementById("active-users");
  const maxActiveUsersField = document.getElementById("max-active-users");
  const queueLength = document.getElementById("queue-length");
  const queuePos = document.getElementById("queue-pos");
  const queueInfo = document.getElementById("queue-info");

  const playTime = 120000; // 2 minutes

  const initVals = [0.5, 0, 0, 0, 0];

  const isMobile = /Mobi|Android/i.test(navigator.userAgent);

  const sliders = sliderElements.map((element, i) => {
    return new Slider(element, i, controllIndicator, initVals[i]);
  });

  const controller = new Controller(socket, controllIndicator, sliders);

  rec.addEventListener("click", () => {
    controller.rec();
  });

  controll.addEventListener("touchstart", function (e) {
    controller.touchstart();
    controller.sendControllData(e, rect);
  });

  controll.addEventListener("touchend", () => {
    controller.touchend();
  });

  controll.addEventListener("touchcancel", () => {
    controller.touchend();
  });

  controll.addEventListener("touchmove", function (e) {
    e.preventDefault();
    controller.sendControllData(e, rect);
  });

  exitButton.addEventListener("click", () => {
    exit();
  });

  startButton.addEventListener("click", () => {
    startButton.style.display = "none";
    exitQueueButton.style.display = "block";
    startApp();
  });

  exitQueueButton.addEventListener("click", () => {
    startButton.style.display = "block";
    exitQueueButton.style.display = "none";
    exitQueue();
  });

  // Socket Actions
  socket.on("init", (data) => {
    queueLength.innerHTML = data.queueLength;
    activeUsers.innerHTML = data.activeUsers;
    maxActiveUsersField.innerHTML = data.maxActiveUsers;
    showOverlay();
  });

  socket.on("queue-length", (data) => {
    queueLength.innerHTML = data;
  });

  socket.on("queue-pos", (data) => {
    queuePos.innerHTML = data;
    queueInfo.style.display = "block";
  });

  socket.on("active-users", (data) => {
    activeUsers.innerHTML = data;
  });

  socket.on("start", () => {
    hideOverlay();
    enableFullscreen();
    queuePos.innerHTML = " -";
    queueInfo.style.display = "none";
    startButton.style.display = "block";
    exitQueueButton.style.display = "none";
    setTimeout(() => {
      exit();
    }, playTime);
  });

  // Functions
  function exit() {
    showOverlay();
    disableFullscreen();
    exitApp();
  }

  function enableFullscreen() {
    if (isMobile) {
      wrapper.requestFullscreen();
    }
  }

  function disableFullscreen() {
    if (isMobile) {
      document.exitFullscreen();
    }
  }

  function showOverlay() {
    overlay.style.display = "flex";
  }
  function hideOverlay() {
    overlay.style.display = "none";
  }

  function startApp() {
    socket.emit("start");
  }

  function exitApp() {
    socket.emit("exit");
  }

  function exitQueue() {
    socket.emit("exit-queue");
    queuePos.innerHTML = " -";
    queueInfo.style.display = "none";
  }
};
