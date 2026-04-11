import { AlertCircle, CheckCircle, Clock, XCircle } from "lucide-react";
import { cn } from "../ui/utils";

interface TimelineEvent {
  id: string;
  title: string;
  description?: string;
  timestamp: string;
  status: "completed" | "in_progress" | "pending" | "error";
}

interface TimelineProps {
  events: TimelineEvent[];
  className?: string;
}

export function Timeline({ events, className }: TimelineProps) {
  const statusIcons = {
    completed: <CheckCircle className="h-5 w-5 text-green-500" />,
    in_progress: <Clock className="h-5 w-5 text-blue-500" />,
    pending: <AlertCircle className="h-5 w-5 text-gray-400" />,
    error: <XCircle className="h-5 w-5 text-red-500" />,
  };

  return (
    <div className={cn("relative space-y-4", className)}>
      {events.map((event, idx) => (
        <div key={event.id} className="flex gap-4">
          <div className="flex flex-col items-center">
            <div className="flex items-center justify-center">{statusIcons[event.status]}</div>
            {idx < events.length - 1 && (
              <div className="w-0.5 h-12 bg-border mt-2" />
            )}
          </div>
          <div className="pb-4 flex-1">
            <div className="font-semibold text-sm">{event.title}</div>
            {event.description && (
              <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
            )}
            <span className="text-xs text-muted-foreground mt-2 block">
              {event.timestamp}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
