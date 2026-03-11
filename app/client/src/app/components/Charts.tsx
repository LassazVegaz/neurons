import { LineChart, Line, XAxis, YAxis, Tooltip } from "recharts";
import { FinishedTrainingResults } from "shared";

type PredictionChartProps = {
  data: FinishedTrainingResults;
};

export type MseChartProps = {
  data: { x: number; mse: number }[];
};

export const PredictionsChart = (props: PredictionChartProps) => (
  <LineChart
    className="bg-gray-800 rounded-lg box-border w-full h-full"
    width="100%"
    height="100%"
    data={props.data}
  >
    <Line dataKey="actual" dot={false} stroke="green" />
    <Line dataKey="prediction" dot={false} stroke="red" />
    <XAxis dataKey="x" type="number" />
    <YAxis />
    <Tooltip
      labelStyle={{ color: "black" }}
      contentStyle={{
        backgroundColor: "#999",
        borderRadius: "8px",
      }}
      itemStyle={{ color: "#333" }}
    />
  </LineChart>
);

export const MseChart = (props: MseChartProps) => (
  <LineChart
    className="bg-gray-800 rounded-lg box-border w-full h-full"
    width="100%"
    height="100%"
    data={props.data}
  >
    <Line
      dataKey="mse"
      dot={false}
      stroke="yellow"
      type="monotone"
      isAnimationActive={false}
    />
    <XAxis dataKey="x" type="number" />
    <YAxis />
    <Tooltip
      labelStyle={{ color: "black" }}
      contentStyle={{
        backgroundColor: "#999",
        borderRadius: "8px",
      }}
      itemStyle={{ color: "#333" }}
    />
  </LineChart>
);
