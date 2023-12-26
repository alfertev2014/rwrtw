import { type Lifecycle } from "../placeholder/lifecycle"

export type EventHandlersMap = Record<string, EventListenerOrEventListenerObject>

export class EventHandlerController<E extends Element = Element> implements Lifecycle {
  readonly element: E
  readonly eventsMap: EventHandlersMap
  constructor(element: E, eventsMap: EventHandlersMap) {
    this.element = element
    this.eventsMap = eventsMap
  }

  mount(): void {
    for (const [eventName, handler] of Object.entries(this.eventsMap)) {
      this.element.addEventListener(eventName, handler)
    }
  }

  unmount(): void {
    for (const [eventName, handler] of Object.entries(this.eventsMap)) {
      this.element.removeEventListener(eventName, handler)
    }
  }
}
