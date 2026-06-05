import { ComponentProps } from "react";
import { twMerge } from "tailwind-merge";

export const FieldContainer = (props: React.ComponentProps<"div">) => (
  <div {...props} className={twMerge("flex flex-col gap-1", props.className)} />
);

export const TextField = (props: ComponentProps<"input">) => (
  <input
    type="text"
    {...props}
    className={twMerge(
      "bg-gray-700 text-white rounded px-2 py-1",
      props.className,
    )}
  />
);

export const Button = (props: React.ComponentProps<"button">) => (
  <button
    {...props}
    className={twMerge(
      "text-white font-bold py-2 px-4 rounded disabled:opacity-45 cursor-pointer",
      props.className,
    )}
  />
);
