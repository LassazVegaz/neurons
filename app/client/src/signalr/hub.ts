"use client";
import { sleep } from "@/helpers/threading";
import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
} from "@microsoft/signalr";

export default class Hub<
  Events extends Record<string, unknown[]>,
  Methods extends Record<string, unknown[]>,
  Functions extends Record<string, [unknown[], unknown]>,
> {
  private onconnectedListeners: (() => void)[] = [];

  public constructor(public readonly connection: HubConnection) {}

  on<E extends keyof Events>(
    methodName: E,
    newMethod: (...args: Events[E]) => void,
  ) {
    if (typeof methodName === "string")
      this.connection.on(methodName, newMethod);
  }

  off<E extends keyof Events>(eventName: E): void;
  off<E extends keyof Events>(
    eventName: E,
    method: (...args: Events[E]) => void,
  ): void;
  off<E extends keyof Events>(
    eventName: E,
    method?: (...args: Events[E]) => void,
  ) {
    if (typeof eventName !== "string") return;
    if (method === undefined) this.connection.off(eventName);
    else this.connection.off(eventName, method);
  }

  async send<M extends keyof Methods>(methodName: M, ...args: Methods[M]) {
    if (typeof methodName === "string")
      await this.connection.send(methodName, ...args);
  }

  async invoke<F extends keyof Functions>(
    funcName: F,
    ...args: Functions[F][0]
  ): Promise<Functions[F][1]> {
    if (typeof funcName === "string")
      return await this.connection.invoke(funcName, ...args);
    else throw new Error("function name is not a string");
  }

  onconncted(listener: () => void) {
    this.onconnectedListeners.push(listener);
  }

  removeOnconncted(listener: () => void) {
    this.onconnectedListeners = this.onconnectedListeners.filter(
      (l) => l !== listener,
    );
  }

  async start() {
    if (this.connection.state === HubConnectionState.Disconnecting) {
      this.log("waiting to disconnect before connecting");
      let tries = 0;
      do {
        if (++tries > 3) {
          this.log("didn't disconnect after waiting 3s. stopped waiting");
          break;
        }
        await sleep(1000);
      } while (this.connection.state === HubConnectionState.Disconnecting);
    }

    if (this.connection.state === HubConnectionState.Disconnected) {
      await this.connection.start();
      for (const l of this.onconnectedListeners) l();
    }
  }

  async stop() {
    if (this.connection.state !== HubConnectionState.Connecting)
      await this.connection.stop();
  }

  private log(msg: string) {
    console.log("local hub:", msg);
  }
}

export const makeHub = <
  Events extends Record<string, unknown[]>,
  Methods extends Record<string, unknown[]>,
  Functions extends Record<string, [unknown[], unknown]>,
>(
  url?: string,
) => {
  if (!url) throw new Error("URL cannot be null");

  const connection = new HubConnectionBuilder()
    .withUrl(url)
    .withAutomaticReconnect()
    .configureLogging(LogLevel.Critical)
    .build();

  return new Hub<Events, Methods, Functions>(connection);
};
