import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { FileText, ExternalLink, BarChart3 } from "lucide-react";
import { cn } from "../ui/utils";

interface AnalysisCardProps {
  title: string;
  description?: string;
  status?: "completed" | "in_progress" | "pending";
  metrics?: Array<{ label: string; value: string | number }>;
  riskLevel?: "low" | "medium" | "high";
  onViewDetails?: () => void;
  onViewReport?: () => void;
  className?: string;
}

export function AnalysisCard({
  title,
  description,
  status = "completed",
  metrics,
  riskLevel,
  onViewDetails,
  onViewReport,
  className,
}: AnalysisCardProps) {
  const statusStyles = {
    completed: "bg-green-100 text-green-800",
    in_progress: "bg-blue-100 text-blue-800",
    pending: "bg-gray-100 text-gray-800",
  };

  const riskStyles = {
    low: "bg-green-100 text-green-800",
    medium: "bg-yellow-100 text-yellow-800",
    high: "bg-red-100 text-red-800",
  };

  const statusLabels = {
    completed: "Concluída",
    in_progress: "Em progresso",
    pending: "Pendente",
  };

  return (
    <Card className={cn("hover:shadow-lg transition-shadow", className)}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          <div className="flex gap-2">
            {status && <Badge className={statusStyles[status]}>{statusLabels[status]}</Badge>}
            {riskLevel && <Badge className={riskStyles[riskLevel]}>Risco: {riskLevel}</Badge>}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {metrics && metrics.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
            {metrics.map((metric, idx) => (
              <div key={idx} className="text-center">
                <p className="text-2xl font-bold text-primary">{metric.value}</p>
                <p className="text-xs text-muted-foreground">{metric.label}</p>
              </div>
            ))}
          </div>
        )}
        <div className="flex gap-2 mt-6">
          {onViewDetails && (
            <Button variant="outline" size="sm" onClick={onViewDetails} className="flex-1">
              <BarChart3 className="h-4 w-4 mr-2" />
              Detalhes
            </Button>
          )}
          {onViewReport && (
            <Button variant="outline" size="sm" onClick={onViewReport} className="flex-1">
              <FileText className="h-4 w-4 mr-2" />
              Relatório
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
