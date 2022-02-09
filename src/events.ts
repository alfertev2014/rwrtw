import { Lifecycle } from "component"

export interface EventHandlersMap {
    [key: string]: EventListenerOrEventListenerObject
}

export class EventHandlerController<E extends Element = Element> implements Lifecycle {
    element: E
    eventsMap: EventHandlersMap
    constructor(element: E, eventsMap: EventHandlersMap) {
        this.element = element
        this.eventsMap = eventsMap
    }

    mount() {
        for (const [eventName, handler] of Object.entries(this.eventsMap)) {
            this.element.addEventListener(eventName, handler)
        }
    }

    unmount() {
        for (const [eventName, handler] of Object.entries(this.eventsMap)) {
            this.element.removeEventListener(eventName, handler)
        }
    }
}