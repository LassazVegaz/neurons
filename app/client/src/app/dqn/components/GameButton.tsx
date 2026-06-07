import { ComponentProps } from "react";
import { twMerge } from "tailwind-merge";

type GameButtonProps = ComponentProps<"div"> & {
  isPlayingNow?: boolean;
  rewards: number;
  label: number | string;
};

export default function GameButton({
  className,
  rewards,
  label,
  isPlayingNow,
  ...props
}: GameButtonProps) {
  return (
    <div
      {...props}
      className={twMerge(
        "border border-blue-400 flex flex-col gap-1 justify-center items-center w-20 py-2 rounded cursor-pointer duration-300 hover:border-blue-700",
        isPlayingNow && "bg-gray-950",
        className,
      )}
    >
      <div className="text-blue-300 text-sm">{label}</div>
      <div>{rewards.toFixed(2)}</div>
    </div>
  );
}
