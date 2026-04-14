import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 cursor-pointer items-center justify-center rounded-full border border-transparent text-sm font-semibold whitespace-nowrap no-underline transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "border-[var(--mk-cta)] bg-[var(--mk-cta)] text-[var(--mk-cta-ink)] shadow-[0_14px_28px_rgba(50,220,194,0.22)] hover:-translate-y-px hover:border-[var(--mk-cta-hover)] hover:bg-[var(--mk-cta-hover)] hover:shadow-[0_18px_34px_rgba(50,220,194,0.28)]",
        outline:
          "border-[#d7e4de] bg-white text-[#102320] shadow-[0_8px_20px_rgba(13,36,32,0.05)] hover:-translate-y-px hover:border-[var(--mk-cta)] hover:bg-[var(--mk-cta-soft)]",
        secondary:
          "border-[#b9efe1] bg-[#e9fbf5] text-[#0d2420] shadow-[0_8px_20px_rgba(43,224,181,0.12)] hover:-translate-y-px hover:bg-[#ddf8ef]",
        ghost:
          "border-transparent bg-transparent text-[#3d5350] hover:bg-[#eef7f3] hover:text-[#0d2420]",
        destructive:
          "border-red-200 bg-red-50 text-red-600 shadow-[0_8px_18px_rgba(220,38,38,0.08)] hover:-translate-y-px hover:bg-red-100",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-11 gap-2 px-5 has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4",
        xs: "h-8 gap-1.5 px-3 text-xs [&_svg:not([class*='size-'])]:size-3",
        sm: "h-9 gap-1.5 px-4 text-[0.85rem] [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-12 gap-2 px-6 text-sm has-data-[icon=inline-end]:pr-5 has-data-[icon=inline-start]:pl-5",
        icon: "size-11",
        "icon-xs":
          "size-8 [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-9",
        "icon-lg": "size-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props} />
  );
}

export { Button, buttonVariants }
