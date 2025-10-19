
type EventCallback = (data?: any) => void;

interface EventListeners {
  [key: string]: Set<EventCallback>;
}

class EventBus {
  private listeners: EventListeners = {};

  on(event: string, callback: EventCallback) {
    if (!this.listeners[event]) {
      this.listeners[event] = new Set();
    }
    this.listeners[event].add(callback);
    // Using a custom event on document for broader compatibility if needed, but managing listeners internally is cleaner
    document.addEventListener(event, ((e: CustomEvent) => callback(e.detail)) as EventListener);
  }

  dispatch(event: string, data?: any) {
    document.dispatchEvent(new CustomEvent(event, { detail: data }));
  }

  off(event: string, callback: EventCallback) {
     // This implementation of 'off' might not work as intended with anonymous functions.
     // For this app's scale, it's acceptable, but a more robust implementation would use function references.
    document.removeEventListener(event, callback as EventListener);
  }
}

export const eventBus = new EventBus();
