import * as React from "react"

const buttonVariants = {
  default:
    "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none bg-blue-600 text-white hover:bg-blue-700 px-4 py-2",
  outline:
    "inline-flex items-center justify-center rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none",
}

export const Button = React.forwardRef(
  ({ className = "", variant = "default", ...props }, ref) => {
    return (
      <button
        className={`${buttonVariants[variant] || buttonVariants.default} ${className}`}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button" 