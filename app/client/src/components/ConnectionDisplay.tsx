import { ComponentProps } from "react";
import { twMerge } from "tailwind-merge";

type ConnectionDisplayProps = ComponentProps<"div"> & {
  hide: boolean;
};

export default function ConnectionDisplay({
  className,
  hide,
  ...props
}: ConnectionDisplayProps) {
  return (
    <div
      {...props}
      className={twMerge(
        "absolute bottom-0 left-0 right-0",
        hide && "hidden",
        className,
      )}
    >
      connecting...
    </div>
  );
}
