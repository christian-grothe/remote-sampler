export class Slider {
  constructor(element, index, val, socket, controller) {
    this.index = index;
    this.element = element;
    this.posIndicator = this.element.getElementsByClassName("pos-indicator")[0];
    this.rect = this.element.getBoundingClientRect();
    this.data = val;

    this.reset();

    controller.sliders.push(this);

    this.element.addEventListener("touchmove", (e) => {
      e.preventDefault();
      const pos = e.targetTouches[0].clientY - this.rect.top;
      const data = (this.rect.height - pos) / this.rect.height;
      if (data < 0 || data > 1) return;

      if (this.index === 2) {
        this.data = data * 0.25;
        controller.setFrameSize(this.data * 100);
      } else {
        this.data = data;
      }

      socket.emit(`sliderData${this.index}`, this.data);

      requestAnimationFrame(() => {
        this.posIndicator.style.top = `${pos}px`;
      });
    });
  }

  reset() {
    this.posIndicator.style.bottom = `${this.data * 100}%`;
  }
}
