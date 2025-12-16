import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/shared/utils/cn"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        // AI/Scout buttons - bubbly, rounded, using exact Scout AI color #6EDCD1
        default: "rounded-full bg-scout text-midnight hover:bg-scout/90",
        premium: "btn-premium rounded-full",
        // Non-AI buttons - flat, boxy, minimal (Airtable-style)
        flat: "rounded-sm bg-white border border-gray-200 text-gray-700 hover:bg-gray-50",
        outline: "rounded-sm border border-scout bg-background text-gray-700 hover:bg-scout/10",
        secondary: "rounded-sm bg-gray-100 text-gray-700 hover:bg-gray-200",
        ghost: "rounded-sm hover:bg-gray-100 hover:text-gray-900",
        link: "text-scout underline-offset-4 hover:underline hover:text-scout/80",
        destructive: "rounded-sm bg-destructive text-destructive-foreground hover:bg-destructive/90",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3",
        lg: "h-11 px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }