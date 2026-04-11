import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { cn } from "../../lib/utils";

interface ExpenseChartProps {
  data: Array<{ label: string; value: number }>;
  title?: string;
  description?: string;
  className?: string;
  height?: number;
}

export function ExpenseChart({
  data,
  title,
  description,
  className,
  height = 300,
}: ExpenseChartProps) {
  const COLORS = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6"];

  return (
    <Card className={className}>
      {title && (
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
      )}
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" />
            <YAxis />
            <Tooltip formatter={(value) => `R$ ${value.toLocaleString()}`} />
            <Legend />
            <Bar dataKey="value" fill="#3b82f6" name="Valor" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
