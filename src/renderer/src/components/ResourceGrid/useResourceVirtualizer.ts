import {
  defaultRangeExtractor,
  elementScroll,
  observeElementOffset,
  observeElementRect,
  useVirtualizer,
  type Virtualizer
} from '@tanstack/react-virtual';
import { useLayoutEffect, useRef, useState, type FocusEventHandler, type RefObject } from 'react';
import type { AnyPreview } from '@shared/pluginTypes';
import { findScrollParent } from '../../utils/scrollParent';

export function useResourceVirtualizer(
  entries: AnyPreview[],
  canOpen: boolean
): {
  gridRef: RefObject<HTMLDivElement | null>;
  virtualizer: Virtualizer<HTMLElement, HTMLDivElement>;
  columns: number;
  scrollMargin: number;
  onFocusCapture: FocusEventHandler<HTMLDivElement>;
  onBlurCapture: FocusEventHandler<HTMLDivElement>;
} {
  'use no memo';

  const gridRef = useRef<HTMLDivElement>(null);
  const focusedElement = useRef<HTMLElement | null>(null);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const [layout, setLayout] = useState({
    width: 0,
    columns: 1,
    gap: 0,
    scrollMargin: 0,
    scrollElement: null as HTMLElement | null
  });
  const { width, columns, gap, scrollMargin, scrollElement } = layout;

  // eslint-disable-next-line react-hooks/incompatible-library
  const virtualizer = useVirtualizer<HTMLElement, HTMLDivElement>({
    count: Math.ceil(entries.length / columns),
    enabled: width > 0,
    getScrollElement: () => (gridRef.current ? findScrollParent(gridRef.current) : null),
    initialOffset: () => (gridRef.current ? findScrollParent(gridRef.current).scrollTop : 0),
    observeElementOffset: (instance, onOffset) => {
      const element = instance.scrollElement;
      const targetWindow = instance.targetWindow;
      if (!element || element !== element.ownerDocument.scrollingElement || !targetWindow) {
        if (element) onOffset(element.scrollTop, false);
        return observeElementOffset(instance, onOffset);
      }

      // Document scrolling fires on the window, not on the scrolling element.
      let timeout: ReturnType<typeof setTimeout> | undefined;
      const useScrollend = instance.options.useScrollendEvent && 'onscrollend' in targetWindow;
      const onScrollEnd = (): void => onOffset(targetWindow.scrollY, false);
      const onScroll = (): void => {
        if (!useScrollend) {
          clearTimeout(timeout);
          timeout = setTimeout(onScrollEnd, instance.options.isScrollingResetDelay);
        }
        onOffset(targetWindow.scrollY, true);
      };
      onScrollEnd();
      targetWindow.addEventListener('scroll', onScroll, { passive: true });
      if (useScrollend) targetWindow.addEventListener('scrollend', onScrollEnd);
      return () => {
        clearTimeout(timeout);
        targetWindow.removeEventListener('scroll', onScroll);
        if (useScrollend) targetWindow.removeEventListener('scrollend', onScrollEnd);
      };
    },
    observeElementRect: (instance, onRect) => {
      const element = instance.scrollElement;
      const targetWindow = instance.targetWindow;
      if (!element || element !== element.ownerDocument.scrollingElement || !targetWindow) {
        return observeElementRect(instance, onRect);
      }

      const onResize = (): void =>
        onRect({ width: targetWindow.innerWidth, height: targetWindow.innerHeight });
      onResize();
      targetWindow.addEventListener('resize', onResize, { passive: true });
      return () => targetWindow.removeEventListener('resize', onResize);
    },
    scrollToFn: (offset, options, instance) => {
      const element = instance.scrollElement;
      if (element && element === element.ownerDocument.scrollingElement) {
        instance.targetWindow?.scrollTo({
          top: offset + (options.adjustments ?? 0),
          behavior: options.behavior
        });
      } else {
        elementScroll(offset, options, instance);
      }
    },
    estimateSize: () => (Math.max(0, width - gap * (columns - 1)) / columns) * (4 / 3) + 160,
    scrollMargin,
    gap,
    overscan: 6,
    rangeExtractor: (range) => {
      const indexes = defaultRangeExtractor(range);
      if (focusedIndex !== null && focusedIndex < entries.length) {
        const row = Math.floor(focusedIndex / columns);
        for (
          let index = Math.max(0, row - 1);
          index <= Math.min(range.count - 1, row + 1);
          index++
        ) {
          indexes.push(index);
        }
      }
      return [...new Set(indexes)].sort((a, b) => a - b);
    }
  });

  useLayoutEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;
    const scrollOwner = findScrollParent(grid);

    let frame = 0;
    const measureLayout = (): void => {
      frame = 0;
      const style = getComputedStyle(grid);
      const rect = grid.getBoundingClientRect();
      const scrollParent = findScrollParent(grid);
      const next = {
        width: rect.width,
        columns: style.gridTemplateColumns.split(' ').length,
        gap: parseFloat(style.columnGap) || 0,
        scrollMargin:
          scrollParent === grid.ownerDocument.scrollingElement
            ? rect.top + window.scrollY
            : rect.top -
              scrollParent.getBoundingClientRect().top +
              scrollParent.scrollTop -
              scrollParent.clientTop,
        scrollElement: scrollParent
      };
      setLayout((previous) =>
        previous.width === next.width &&
        previous.columns === next.columns &&
        previous.gap === next.gap &&
        previous.scrollMargin === next.scrollMargin &&
        previous.scrollElement === next.scrollElement
          ? previous
          : next
      );
    };
    const scheduleLayout = (): void => {
      if (!frame) frame = requestAnimationFrame(measureLayout);
    };
    const resizeObserver = new ResizeObserver(scheduleLayout);
    const observeLayout = (): void => {
      resizeObserver.disconnect();
      for (let element: Element | null = grid; element; element = element.parentElement) {
        resizeObserver.observe(element);
        if (element === scrollOwner) break;
        for (
          let sibling = element.previousElementSibling;
          sibling;
          sibling = sibling.previousElementSibling
        ) {
          resizeObserver.observe(sibling);
        }
      }
    };
    const mutationObserver = new MutationObserver((records) => {
      if (records.some((record) => !grid.contains(record.target))) {
        if (
          records.some((record) => record.type === 'childList' && !grid.contains(record.target))
        ) {
          observeLayout();
        }
        scheduleLayout();
      }
    });
    observeLayout();
    for (let element: HTMLElement | null = scrollOwner; element; element = element.parentElement) {
      mutationObserver.observe(element, {
        childList: true,
        subtree: element === scrollOwner,
        attributes: true,
        characterData: true
      });
    }
    window.addEventListener('resize', scheduleLayout);
    window.addEventListener('scroll', scheduleLayout, { passive: true, capture: true });
    measureLayout();

    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      window.removeEventListener('resize', scheduleLayout);
      window.removeEventListener('scroll', scheduleLayout, true);
    };
  }, [scrollElement]);

  useLayoutEffect(() => {
    virtualizer.measure();
    gridRef.current?.querySelectorAll<HTMLDivElement>('[data-index]').forEach((row) => {
      virtualizer.measureElement(row);
    });
  }, [virtualizer, width, columns, gap, entries, canOpen]);

  useLayoutEffect(() => {
    if (focusedIndex !== null && focusedElement.current && !focusedElement.current.isConnected) {
      gridRef.current
        ?.querySelector<HTMLButtonElement>(`[data-resource-index="${focusedIndex}"] button`)
        ?.focus({ preventScroll: true });
    }
  }, [columns, focusedIndex]);

  return {
    gridRef,
    virtualizer,
    columns,
    scrollMargin,
    onFocusCapture: (event) => {
      const card = (event.target as HTMLElement).closest<HTMLElement>('[data-resource-index]');
      if (card) {
        focusedElement.current = event.target as HTMLElement;
        setFocusedIndex(Number(card.dataset.resourceIndex));
      }
    },
    onBlurCapture: (event) => {
      if (!event.currentTarget.contains(event.relatedTarget)) {
        focusedElement.current = null;
        setFocusedIndex(null);
      }
    }
  };
}
