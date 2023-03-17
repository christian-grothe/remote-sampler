export class Slider {
  constructor(element, index, controllIndicator) {
    this.index = index;
    this.element = element;
    this.controllIndicator = controllIndicator;
    this.posIndicator = this.element.getElementsByClassName("pos-indicator")[0];
    this.rect = this.element.getBoundingClientRect();
    this.data = 0.5;

    this.element.addEventListener("touchmove", (e) => {
      e.preventDefault();
      const pos = e.touches[0].clientY - this.rect.top;
      const data = (this.rect.height - pos) / this.rect.height;
      if (data < 0 || data > 1) return;
      this.data = data;

      requestAnimationFrame(() => {
        this.posIndicator.style.top = `${pos}px`;

        // frame slider changes ui
        if (this.index === 2) {
          this.controllIndicator.style.width = `${this.data * 100}%`;
        }
      });
    });
  }
}
