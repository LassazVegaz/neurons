import { HubConnection, HubConnectionBuilder } from "@microsoft/signalr";
import { TrainingResult, TrainParams } from "./network.hub.types";

type Events = {
  TrainingFinished: [TrainingResult[]];
  TrainingStopped: [];
  IterationBreak: [number, number[]];
};

type Methods = {
  Train: [TrainParams];
  StopTraining: [];
};

class NetworkHub {
  constructor(private readonly connection: HubConnection) {}

  on<E extends keyof Events>(
    methodName: E,
    newMethod: (...args: Events[E]) => void,
  ) {
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
    if (method === undefined) this.connection.off(eventName);
    else this.connection.off(eventName, method);
  }

  invoke<M extends keyof Methods>(methodName: M, ...args: Methods[M]) {
    this.connection.invoke(methodName, ...args);
  }
}

const buildConnection = () => {
  const networkHubUrl = process.env.NEXT_PUBLIC_NETWORK_HUB;
  if (!networkHubUrl)
    throw new Error(
      "NEXT_PUBLIC_NETWORK_HUB is not defined in environment variables",
    );
  return new HubConnectionBuilder().withUrl(networkHubUrl).build();
};

const networkHub = new NetworkHub(buildConnection());
export default networkHub;
