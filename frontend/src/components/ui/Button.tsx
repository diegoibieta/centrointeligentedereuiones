import { cn } from "@/lib/utils";
import { forwardRef } from "react";
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
}
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed",
          {
            "bg-brand-600 text-white hover:bg-brand-700": variant === "primary",
            "bg-gray-100 text-gray-700 hover:bg-gray-200": variant === "secondary",
            "bg-red-600 text-white hover:bg-red-700": variant === "danger",
            "text-gray-600 hover:bg-gray-100": variant === "ghost",
          },
          {
            "px-2.5 py-1.5 text-sm": size === "sm",
            "px-4 py-2 text-sm": size === "md",
            "px-6 py-3 text-base": size === "lg",
          },
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
