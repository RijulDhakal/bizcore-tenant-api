import * as React from "react"
import { Input } from "./input"

export interface NumberInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  onValueChange?: (value: number) => void
}

const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
  ({ onValueChange, onChange, onFocus, onBlur, ...props }, ref) => {
    return (
      <Input
        ref={ref}
        type="number"
        onWheel={(e) => e.currentTarget.blur()}
        onFocus={(e) => {
          if (e.target.value === "0") {
            e.target.value = ""
          }
          onFocus?.(e)
        }}
        onBlur={(e) => {
          if (e.target.value === "") {
            e.target.value = "0"
            onValueChange?.(0)
          }
          onBlur?.(e)
        }}
        onChange={(e) => {
          onChange?.(e)
          const val = parseFloat(e.target.value)
          onValueChange?.(isNaN(val) ? 0 : val)
        }}
        {...props}
      />
    )
  }
)
NumberInput.displayName = "NumberInput"

export { NumberInput }
