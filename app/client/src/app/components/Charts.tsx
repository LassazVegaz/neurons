import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  TooltipContentProps,
} from "recharts";
import { TrainingResult } from "../../signalr/network.hub.types";

type PredictionChartProps = {
  data: TrainingResult[];
  showActualLine: boolean;
};

export type MseChartProps = {
  data: { x: number; mse: number }[];
};

const CustomTooltip = ({ active, payload, label }: TooltipContentProps) => {
  if (!active || !payload?.length) return <></>;

  let diff: number | undefined;
  let perc: string | undefined;
  if (
    typeof payload[0]?.value === "number" &&
    typeof payload[1]?.value === "number"
  ) {
    diff = Math.abs(payload[0].value - payload[1].value);
    perc = Math.abs((diff / payload[0].value) * 100).toFixed(2);
  }

  return (
    <div className="bg-[#999] p-3 rounded-lg border border-gray-600">
      {/* The Label (X-Value) */}
      <p className="text-black font-bold mb-2">{label}</p>

      {/* Mapping through your lines (Actual and Prediction) */}
      {payload.map((entry) => (
        <p
          key={entry.dataKey?.toString()}
          style={{ color: "#333" }}
          className="text-sm"
        >
          {entry.name}: <span className="font-mono">{entry.value}</span>
        </p>
      ))}

      {/* --- YOUR NEW ELEMENT HERE --- */}
      <div className="mt-2 pt-2 border-t border-gray-400 text-xs text-red-800 italic">
        ⚠️ Diff: {diff} ({perc})%
      </div>
    </div>
  );
};

export const PredictionsChart = (props: PredictionChartProps) => (
  <LineChart
    className="bg-gray-800 rounded-lg box-border w-full h-full"
    width="100%"
    height="100%"
    data={props.data}
  >
    {props.showActualLine && <Line dataKey="y" dot={false} stroke="green" />}
    <Line dataKey="prediction" dot={false} stroke="red" />
    <ReferenceLine x={0} stroke="gray" />
    <ReferenceLine y={0} stroke="gray" />
    <XAxis dataKey="x" type="number" />
    <YAxis />
    <Tooltip
      labelStyle={{ color: "black" }}
      contentStyle={{
        backgroundColor: "#999",
        borderRadius: "8px",
      }}
      itemStyle={{ color: "#333" }}
      content={CustomTooltip}
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
