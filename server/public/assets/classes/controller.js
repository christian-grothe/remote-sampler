export class Controller {
  constructor(socket, controllIndicator, sliders) {
    this.socket = socket;
    this.controllIndicator = controllIndicator;
    this.frameSize = 0;
    this.sliders = sliders;
    this.isTouched = false;
  }

  touchstart(e, rect) {
    if (this.isTouched) return;
    this.socket.emit("touchstart", this._initData(e, rect));
    this.controllIndicator.classList.add("animate");
    this.isTouched = true;
  }

  touchend() {
    setTimeout(() => {
      this.isTouched = false;
      this.socket.emit("touchend");
      this.controllIndicator.classList.remove("animate");
    }, 50);
  }

  rec() {
    this.socket.emit("rec");
  }

  sendControllData(e, rect) {
    this.socket.emit("controllerData", this._getControllData(e, rect));
  }

  // private functions
  _initData(e, rect) {
    const controlData = this._getControllData(e, rect);
    const sliderData = this._getSliderData();

    return {
      ...controlData,
      sliderData,
    };
  }

  _getControllData(e, rect) {
    let x, y;
    x = e.targetTouches[0].clientX - rect.left;
    y = e.targetTouches[0].clientY - rect.top;

    if (y < 0) {
      y = 0;
    } else if (y > rect.height) {
      y = rect.height;
    }

    this._moveControlIndicator(x);

    return {
      x: x / rect.width,
      y: y / rect.height,
    };
  }

  _getSliderData() {
    const sliderData = this.sliders.map((slider) => {
      return slider.data;
    });

    return sliderData;
  }

  _moveControlIndicator(x) {
    console.log(x);
    requestAnimationFrame(() => {
      this.controllIndicator.style.left = `${x}px`;
      this.frameSize =
        this.controllIndicator.offsetWidth /
        this.controllIndicator.parentNode.clientWidth;
    });
  }
}
