import { ComponentProps } from "react";
import { twMerge } from "tailwind-merge";

export default function ControlPanelContainer({
  className,
  ...props
}: ComponentProps<"div">) {
  return (
    <div
      className={twMerge("flex flex-col gap-4 pt-4 px-4", className)}
      {...props}
    />
  );
}
