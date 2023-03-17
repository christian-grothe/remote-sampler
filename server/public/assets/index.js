import { Controller } from "./classes/controller.js";
import { Slider } from "./classes/slider.js";

window.onload = function () {
  const socket = io();

  const rec = document.getElementById("rec");
  const controll = document.getElementById("controll");
  const rect = controll.getBoundingClientRect();
  const sliderElements = Array.from(document.querySelectorAll(".slider"));
  const controllIndicator = document.getElementById("controll-indicator");

  let isActive = false;

  handleIsActive(isActive, socket);

  const sliders = sliderElements.map((element, i) => {
    return new Slider(element, i, controllIndicator);
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

  socket.on("start", () => {
    isActive = true;
    handleIsActive(isActive);
  });
};

function handleIsActive(isActive, socket) {
  if (!isActive) {
    showOverlay(socket);
  } else {
    hideOverlay();
  }
}

function showOverlay(socket) {
  const overlay = document.createElement("div");
  overlay.id = "overlay";
  const startButton = document.createElement("button");
  startButton.innerHTML = "Start";
  startButton.addEventListener("click", () => startApp(socket));
  overlay.append(startButton);
  document.body.prepend(overlay);
}

function hideOverlay() {
  const overlay = document.getElementById("overlay");
  if (overlay) {
    overlay.remove();
  }
}

function startApp(socket) {
  socket.emit("start");
}
