export class Controller {
  constructor(socket) {
    this.socket = socket;
    this.indicators = new Map();
    this.activeTouches = new Map();
    this.sliders = new Array();
    this.frameSize = 0;
    this.controll = document.getElementById("controll");
    this.rect = this.controll.getBoundingClientRect();
    this.now = new Date().getTime();
    this.previousNow = new Date().getTime();
    this.maxVoices = 1;
    this.speedLimit = 500;
    this.hold = 300;
    this.wait = false;
  }

  rec() {
    this.socket.emit("rec");
  }

  touchstart(e) {
    if (!this._checkSpeed() || this.wait) return;
    const touch = e.changedTouches[0];
    const newTouch = this._cacheTouch(touch);
    if (!newTouch) return;

    this.socket.emit("touchstart", {
      newTouch,
      sliderData: this._getSliderData(),
    });
  }

  touchend(e) {
    this._handleWait();
    const identifier = e.changedTouches[0].identifier;
    const indicator = this.indicators.get(identifier);
    const index = this.activeTouches.get(identifier).index;
    this.activeTouches.delete(identifier);
    this.indicators.delete(identifier);

    setTimeout(() => {
      indicator.remove();
      this.socket.emit("touchend", index);
    }, this.hold);
  }

  touchmove(e) {
    if (this.wait) return;
    const targetTouches = Array.from(e.targetTouches);

    targetTouches.forEach((touch) => {
      const identifier = touch.identifier;
      const cachedTouch = this.activeTouches.get(identifier);
      const indicator = document.getElementById(`touch${identifier}`);
      const indicatorRect = indicator.getBoundingClientRect();
      //if (indicatorRect.width + indicatorRect.left >= this.rect.width) return;
      if (!touch) return;
      let x = (touch.clientX - this.rect.left) / this.rect.width;
      let y = (touch.clientY - this.rect.top) / this.rect.height;
      requestAnimationFrame(() => {
        indicator.style.left = `${x * 100}%`;
      });

      this.socket.emit("controllerData", {
        index: cachedTouch.index,
        x,
        y,
      });
    });
  }

  setFrameSize(size) {
    this.frameSize = size;
    for (const [key, value] of this.indicators.entries()) {
      requestAnimationFrame(() => {
        value.style.width = `${size}%`;
      });
    }
  }

  // private functions
  _createIndicator(touch) {
    const x = touch.clientX - this.rect.left;
    const newIndicator = document.createElement("div");
    newIndicator.classList.add("controll-indicator");
    newIndicator.classList.add("animate");
    newIndicator.id = `touch${touch.identifier}`;
    newIndicator.style.left = `${x}px`;
    newIndicator.style.width = `${this.frameSize}%`;
    this.controll.appendChild(newIndicator);
    this.indicators.set(touch.identifier, newIndicator);
  }

  _getSliderData() {
    const sliderData = this.sliders.map((slider) => {
      return slider.data;
    });

    return sliderData;
  }

  _checkSpeed() {
    this.now = new Date().getTime();
    if (this.now - this.previousNow <= this.speedLimit) {
      this.previousNow = new Date().getTime();
      return false;
    } else {
      this.previousNow = new Date().getTime();
      return true;
    }
  }

  _cacheTouch(touch) {
    if (this.activeTouches.size >= this.maxVoices) return false;

    const touchArray = Array.from(this.activeTouches.values());
    let freeIndex = 0;
    touchArray.forEach((t) => {
      if (freeIndex !== t.index) return;
      freeIndex++;
    });

    this._createIndicator(touch);
    let x = (touch.clientX - this.rect.left) / this.rect.width;
    let y = (touch.clientY - this.rect.top) / this.rect.height;
    const newTouch = {
      index: freeIndex,
      x,
      y,
    };
    this.activeTouches.set(touch.identifier, newTouch);
    return newTouch;
  }

  _handleWait() {
    this.wait = true;
    this.controll.classList.add("wait");

    setTimeout(() => {
      this.controll.classList.remove("wait");

      this.wait = false;
    }, this.hold);
  }
}
