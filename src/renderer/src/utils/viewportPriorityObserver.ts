import { findScrollParent } from './scrollParent';

export const ViewportPriorityLevel = { BACKGROUND: 0, MOUNTED: 1, VISIBLE: 3 } as const;

type ElementObservation = { count: number; root: HTMLElement | null; priority: number };
type RootObservation = { elements: Set<HTMLElement>; intersection: IntersectionObserver };

export class ViewportPriorityObserver {
  private readonly elements = new Map<HTMLElement, ElementObservation>();
  private readonly roots = new Map<HTMLElement | null, RootObservation>();
  private resizeObserver: ResizeObserver | undefined;

  constructor(private readonly onChange: () => void) {}

  private readonly handleChange = (): void => {
    if (this.elements.size) this.onChange();
  };

  observe(element: HTMLElement): () => void {
    let observation = this.elements.get(element);
    if (observation) {
      observation.count++;
    } else {
      if (!this.resizeObserver) {
        this.resizeObserver = new ResizeObserver(this.handleChange);
        window.addEventListener('resize', this.handleChange, { passive: true });
        window.addEventListener('scroll', this.handleChange, { passive: true, capture: true });
      }

      const scrollParent = findScrollParent(element);
      const root = scrollParent === element.ownerDocument.scrollingElement ? null : scrollParent;
      observation = { count: 1, root, priority: ViewportPriorityLevel.MOUNTED };
      this.elements.set(element, observation);
      let rootObservation = this.roots.get(root);
      if (!rootObservation) {
        rootObservation = {
          elements: new Set(),
          intersection: new IntersectionObserver(this.handleChange, { root })
        };
        this.roots.set(root, rootObservation);
        if (root) {
          root.addEventListener('scroll', this.handleChange, { passive: true });
          this.resizeObserver.observe(root);
        }
      }
      rootObservation.elements.add(element);
      rootObservation.intersection.observe(element);
      if (!this.roots.has(element)) this.resizeObserver.observe(element);
      this.onChange();
    }

    let released = false;
    return (): void => {
      if (released) return;
      released = true;
      if (--observation.count) return;

      this.elements.delete(element);
      if (!this.roots.has(element)) this.resizeObserver?.unobserve(element);
      const { root } = observation;
      const rootObservation = this.roots.get(root)!;
      rootObservation.intersection.unobserve(element);
      rootObservation.elements.delete(element);
      if (!rootObservation.elements.size) {
        rootObservation.intersection.disconnect();
        this.roots.delete(root);
        if (root) {
          root.removeEventListener('scroll', this.handleChange);
          if (!this.elements.has(root)) this.resizeObserver?.unobserve(root);
        }
      }

      if (!this.elements.size) {
        this.resizeObserver?.disconnect();
        this.resizeObserver = undefined;
        window.removeEventListener('resize', this.handleChange);
        window.removeEventListener('scroll', this.handleChange, true);
      }
      this.onChange();
    };
  }

  measure(): void {
    if (!this.elements.size) return;
    const viewport = {
      top: 0,
      left: 0,
      right: document.documentElement.clientWidth,
      bottom: document.documentElement.clientHeight
    };

    for (const [root, observation] of this.roots) {
      let view = viewport;
      let rootRect: DOMRect | undefined;
      if (root) {
        rootRect = root.getBoundingClientRect();
        const top = rootRect.top + root.clientTop;
        const left = rootRect.left + root.clientLeft;
        view = {
          top: Math.max(viewport.top, top),
          left: Math.max(viewport.left, left),
          right: Math.min(viewport.right, left + root.clientWidth),
          bottom: Math.min(viewport.bottom, top + root.clientHeight)
        };
      }

      for (const element of observation.elements) {
        const tracked = this.elements.get(element)!;
        tracked.priority = ViewportPriorityLevel.BACKGROUND;
        if (!element.isConnected) continue;
        tracked.priority = ViewportPriorityLevel.MOUNTED;
        if (view.bottom <= view.top || view.right <= view.left) continue;
        const rect = element === root ? rootRect! : element.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) continue;

        const visible =
          rect.bottom > view.top &&
          rect.top < view.bottom &&
          rect.right > view.left &&
          rect.left < view.right;
        const dx = Math.max(view.left - rect.right, rect.left - view.right, 0);
        const dy = Math.max(view.top - rect.bottom, rect.top - view.bottom, 0);
        tracked.priority = visible
          ? ViewportPriorityLevel.VISIBLE
          : ViewportPriorityLevel.MOUNTED + 1 / (2 + Math.round(Math.hypot(dx, dy)));
      }
    }
  }

  priority(element: HTMLElement): number {
    return element.isConnected
      ? (this.elements.get(element)?.priority ?? ViewportPriorityLevel.BACKGROUND)
      : ViewportPriorityLevel.BACKGROUND;
  }
}
