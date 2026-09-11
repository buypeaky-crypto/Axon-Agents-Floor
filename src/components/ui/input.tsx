import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-md bg-secondary px-3 text-sm text-foreground shadow-[0_0_0_1px_rgb(236_234_228/0.1)] outline-none transition-[box-shadow,background-color] duration-150 placeholder:text-subtle focus-visible:shadow-[0_0_0_1px_rgb(216_212_200/0.55)] disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
