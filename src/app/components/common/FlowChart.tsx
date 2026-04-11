import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { ArrowRight } from "lucide-react";
import { cn } from "../ui/utils";

interface FlowNode {
  id: string;
  label: string;
  value?: string;
  status?: "ok" | "warning" | "error";
}

interface FlowChartProps {
  nodes: FlowNode[];
  title?: string;
  description?: string;
  className?: string;
}

export function FlowChart({
  nodes,
  title,
  description,
  className,
}: FlowChartProps) {
  const statusColors = {
    ok: "bg-green-100 text-green-800",
    warning: "bg-yellow-100 text-yellow-800",
    error: "bg-red-100 text-red-800",
  };

  return (
    <Card className={className}>
      {title && (
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
      )}
      <CardContent>
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 flex-wrap">
          {nodes.map((node, idx) => (
            <div key={node.id} className="flex items-center gap-4 flex-wrap">
              <div
                className={cn(
                  "px-4 py-3 rounded-lg min-w-40 text-center",
                  node.status ? statusColors[node.status] : "bg-blue-100 text-blue-800"
                )}
              >
                <p className="font-semibold text-sm">{node.label}</p>
                {node.value && <p className="text-xs mt-1">{node.value}</p>}
              </div>
              {idx < nodes.length - 1 && (
                <ArrowRight className="h-5 w-5 text-muted-foreground hidden md:block" />
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
