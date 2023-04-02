export class Controller {
  constructor(socket) {
    this.socket = socket;
    this.indicators = new Map();
    this.coords = new Map();
    this.sliders = new Array();
    this.frameSize = 0;
    this.controll = document.getElementById("controll");
  }

  touchstart(e, rect) {
    Array.from(e.changedTouches).forEach((touch) => {
      this._createIndicator(touch, this.controll, rect);
      this._setCoords(e, rect);
      this.socket.emit("touchstart", this._collectData());
    });
  }

  touchend(e) {
    Array.from(e.changedTouches).forEach((touch) => {
      const indicator = document.getElementById(`touch${touch.identifier}`);
      this.indicators.delete(touch.identifier);
      this.coords.delete(touch.identifier);
      indicator.remove();
      setTimeout(() => {
        this.socket.emit("touchend", touch.identifier);
      }, 50);
    });
  }

  rec() {
    this.socket.emit("rec");
  }

  touchmove(e, rect) {
    this._setCoords(e, rect);
    this.socket.emit("controllerData", this._coordsToArray());
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
  _createIndicator(touch, controll, rect) {
    const x = touch.clientX - rect.left;
    const newIndicator = document.createElement("div");
    newIndicator.classList.add("controll-indicator");
    newIndicator.classList.add("animate");
    newIndicator.id = `touch${touch.identifier}`;
    newIndicator.style.left = `${x}px`;
    newIndicator.style.width = `${this.frameSize}%`;
    controll.appendChild(newIndicator);
    this.indicators.set(touch.identifier, newIndicator);
  }

  _collectData() {
    const sliderData = this._getSliderData();
    const coordsArray = this._coordsToArray();

    return {
      coordsArray,
      sliderData,
    };
  }

  _coordsToArray() {
    let coordsArray = new Array();

    for (const [key, val] of this.coords.entries()) {
      coordsArray = [...coordsArray, { id: key, x: val.x, y: val.y }];
    }

    return coordsArray;
  }

  _getSliderData() {
    const sliderData = this.sliders.map((slider) => {
      return slider.data;
    });

    return sliderData;
  }

  _setCoords(e, rect) {
    Array.from(e.changedTouches).forEach((touch) => {
      let x = touch.clientX - rect.left;
      let y = touch.clientY - rect.top;

      if (y < 0) {
        y = 0;
      } else if (y > rect.height) {
        y = rect.height;
      }

      const indicator = document.getElementById(`touch${touch.identifier}`);
      requestAnimationFrame(() => {
        indicator.style.left = `${x}px`;
      });

      this.coords.set(touch.identifier, {
        x: x / rect.width,
        y: y / rect.width,
      });
    });
  }
}
