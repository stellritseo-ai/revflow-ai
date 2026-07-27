import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function cva(base: string, config?: any) {
  return function (props?: any): string {
    const classes = [base]
    if (config?.variants) {
      Object.keys(config.variants).forEach((key) => {
        const variantValue = props?.[key] !== undefined ? props[key] : config.defaultVariants?.[key]
        if (variantValue !== undefined && config.variants[key][variantValue]) {
          classes.push(config.variants[key][variantValue])
        }
      })
    }
    if (props?.className) {
      classes.push(props.className)
    }
    return classes.join(" ")
  }
}

export type VariantProps<T extends (...args: any) => any> = Parameters<T>[0] | undefined;
