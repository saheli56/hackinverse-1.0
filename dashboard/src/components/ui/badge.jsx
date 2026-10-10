import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "../../lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80",
        outline: "text-foreground border-border",
        critical:
          "border-rose-500/30 bg-rose-500/10 text-rose-400 font-medium",
        high:
          "border-amber-500/30 bg-amber-500/10 text-amber-400 font-medium",
        medium:
          "border-zinc-700 bg-zinc-800 text-zinc-300 font-medium",
        success:
          "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-medium",
        zinc:
          "border-zinc-800 bg-zinc-900 text-zinc-300",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

function Badge({ className, variant, ...props }) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
