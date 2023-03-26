export class Controller {
  constructor(socket, controllIndicator, sliders) {
    this.socket = socket;
    this.controllIndicator = controllIndicator;
    this.frameSize = 0;
    this.sliders = sliders;
    this.isTouched = false;
  }

  touchstart() {
    if (!this.isTouched) {
      this.socket.emit("touchstart");
      this.controllIndicator.classList.add("animate");
      this.isTouched = true;
    }
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
    this.socket.emit("data", this._getData(e, rect));
  }

  // private functions
  _getData(e, rect) {
    let x, y;
    x = e.touches[0].clientX - rect.left;
    y = e.touches[0].clientY - rect.top;

    // Check if touch event is outside the rectangle
    // if (x < 0) {
    //   x = 0;
    // } else if (x > rect.width) {
    //   x = rect.width;
    // }
    if (y < 0) {
      y = 0;
    } else if (y > rect.height) {
      y = rect.height;
    }

    requestAnimationFrame(() => {
      this.controllIndicator.style.left = `${x}px`;
      this.frameSize =
        this.controllIndicator.offsetWidth /
        this.controllIndicator.parentNode.clientWidth;
    });

    const sliderData = this.sliders.map((slider) => {
      return slider.data;
    });

    const data = {
      x: x / rect.width,
      y: y / rect.height,
      sliderData,
    };

    return data;
  }
}
