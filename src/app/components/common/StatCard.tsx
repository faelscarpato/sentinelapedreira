import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "../ui/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  icon?: React.ReactNode;
  className?: string;
  variant?: "default" | "success" | "warning" | "danger";
}

export function StatCard({
  title,
  value,
  description,
  trend,
  trendValue,
  icon,
  className,
  variant = "default",
}: StatCardProps) {
  const variantStyles = {
    default: "border-l-4 border-l-blue-500",
    success: "border-l-4 border-l-green-500",
    warning: "border-l-4 border-l-yellow-500",
    danger: "border-l-4 border-l-red-500",
  };

  return (
    <Card className={cn(variantStyles[variant], className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
        {trend && trendValue && (
          <div className="flex items-center gap-1 mt-2">
            {trend === "up" && (
              <>
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span className="text-xs text-green-500 font-medium">{trendValue}</span>
              </>
            )}
            {trend === "down" && (
              <>
                <TrendingDown className="h-4 w-4 text-red-500" />
                <span className="text-xs text-red-500 font-medium">{trendValue}</span>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
