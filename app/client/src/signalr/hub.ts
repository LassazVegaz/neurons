"use client";
import { HubConnection, HubConnectionBuilder } from "@microsoft/signalr";

export default class Hub<
  Events extends Record<string, unknown[]>,
  Methods extends Record<string, unknown[]>,
  Functions extends Record<string, [unknown[], unknown[]]>,
> {
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
    method: (...args: unknown[]) => void,
  ): void;
  off<E extends keyof Events>(
    eventName: E,
    method?: (...args: unknown[]) => void,
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
}

export const makeHub = <
  Events extends Record<string, unknown[]>,
  Methods extends Record<string, unknown[]>,
  Functions extends Record<string, [unknown[], unknown[]]>,
>(
  url?: string,
) => {
  if (!url) throw new Error("URL cannot be null");

  const connection = new HubConnectionBuilder()
    .withUrl(url)
    .withAutomaticReconnect()
    .build();

  return new Hub<Events, Methods, Functions>(connection);
};
