import { twMerge } from "tailwind-merge";

type TextFieldProps = {
  label: string;
  name: string;
  value: string;
  onChange: React.ComponentProps<"input">["onChange"];
};

type CheckboxProps = {
  label: string;
  name: string;
  checked: boolean;
  onChange: React.ComponentProps<"input">["onChange"];
};

export const TextField = (props: TextFieldProps) => (
  <div className="flex flex-col gap-1">
    <label htmlFor={props.name}>{props.label}</label>
    <input
      name={props.name}
      type="text"
      value={props.value}
      onChange={props.onChange}
      className="bg-gray-700 text-white rounded px-2 py-1"
    />
  </div>
);

export const Checkbox = (props: CheckboxProps) => (
  <div className="flex items-center gap-2">
    <input
      name={props.name}
      type="checkbox"
      checked={props.checked}
      onChange={props.onChange}
    />
    <label htmlFor={props.name}>{props.label}</label>
  </div>
);

export const Button = ({
  className,
  ...props
}: React.ComponentProps<"button">) => (
  <button
    {...props}
    className={twMerge(
      "text-white font-bold py-2 px-4 rounded disabled:opacity-45 cursor-pointer",
      className,
    )}
  />
);
