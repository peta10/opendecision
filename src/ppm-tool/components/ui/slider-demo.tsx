import { cn } from "@/ppm-tool/shared/lib/utils"
import { Slider } from "@/ppm-tool/components/ui/Slider"

type SliderProps = React.ComponentProps<typeof Slider>

export function SliderDemo({ className, ...props }: SliderProps) {
  return (
    <Slider
      defaultValue={[50]}
      max={100}
      step={1}
      className={cn("w-[60%]", className)}
      {...props}
    />
  )
} 