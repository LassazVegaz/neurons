type EventsShape = Record<string, [unknown[], unknown]>;

type Listener<Events extends EventsShape, E extends keyof Events> = (
  ...args: Events[E][0]
) => Events[E][1];

export default class EventsBucket<Events extends EventsShape> {
  private readonly events: { [E in keyof Events]?: Listener<Events, E>[] } = {};

  on<E extends keyof Events>(event: E, listener: Listener<Events, E>) {
    this.events[event] ??= [];
    this.events[event].push(listener);
  }

  off<E extends keyof Events>(event: E, listener: Listener<Events, E>) {
    if (!this.events[event]) return;
    this.events[event] = this.events[event].filter((l) => l !== listener);
  }

  emit<E extends keyof Events>(event: E, ...args: Events[E][0]) {
    if (!this.events[event]) return;
    for (const listener of this.events[event]) {
      listener(...args);
    }
  }

  getBucket() {
    return {
      on: this.on.bind(this),
      off: this.off.bind(this),
    };
  }
}
