export class Slider {
  constructor(element, index, controllIndicator, val) {
    this.index = index;
    this.element = element;
    this.controllIndicator = controllIndicator;
    this.posIndicator = this.element.getElementsByClassName("pos-indicator")[0];
    this.rect = this.element.getBoundingClientRect();
    this.data = val;

    this.element.addEventListener("touchmove", (e) => {
      e.preventDefault();
      const pos = e.targetTouches[0].clientY - this.rect.top;
      const data = (this.rect.height - pos) / this.rect.height;
      if (data < 0 || data > 1) return;

      if (this.index === 2) {
        this.data = data * 0.25;
      } else {
        this.data = data;
      }

      requestAnimationFrame(() => {
        this.posIndicator.style.top = `${pos}px`;

        // frame slider changes ui
        if (this.index === 2) {
          this.controllIndicator.style.width = `${this.data * 100}%`;
        }
      });
    });

    this.reset();
  }

  reset() {
    this.posIndicator.style.bottom = `${this.data * 100}%`;
    if (this.index === 2) {
      this.controllIndicator.style.width = "2px";
    }
  }
}
