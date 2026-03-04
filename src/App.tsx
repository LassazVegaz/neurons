import { useEffect, useState } from "react";

const myWorker = new Worker(new URL("./worker.ts", import.meta.url), {
  type: "module",
});

export default function App() {
  const [data, setData] = useState<unknown>(null);

  useEffect(() => {
    myWorker.onmessage = (e) => {
      setData(e.data);
    };
  }, []);

  return <div>Data from worker: {JSON.stringify(data)}</div>;
}
