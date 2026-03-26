import { cn } from "@/lib/utils";

interface FinloBrandProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  inline?: boolean;
}

const sizeMap = {
  sm: { width: "w-4", height: "h-4" },
  md: { width: "w-6", height: "h-6" }, 
  lg: { width: "w-8", height: "h-8" },
  xl: { width: "w-10", height: "h-10" }
};

export const FinloBrand = ({ 
  className, 
  size = "md", 
  inline = false 
}: FinloBrandProps) => {
  const Component = inline ? "span" : "div";
  const { width, height } = sizeMap[size];
  
  return (
    <Component className={cn(
      "flex items-center justify-center",
      className
    )}>
      <img 
        src="/lovable-uploads/4fea7866-df16-47a0-9b23-c76e35b6a096.png" 
        alt="Finlo"
        className={cn(width, height, "object-contain")}
      />
    </Component>
  );
};