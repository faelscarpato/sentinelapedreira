import { useMemo } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { TrendingUp, TrendingDown, DollarSign, Activity } from "lucide-react";

// Real data for 2025/2026 based on datasets, 
// Mocked/Trend data for 2020-2024 to skip loading 100MB+ on Home Page
const HISTORICAL_DATA = [
  { year: "2020", receita: 185200000, despesa: 178400000, aPagar: 12500000 },
  { year: "2021", receita: 198500000, despesa: 192300000, aPagar: 15800000 },
  { year: "2022", receita: 215300000, despesa: 208900000, aPagar: 18200000 },
  { year: "2023", receita: 238900000, despesa: 232100000, aPagar: 22400000 },
  { year: "2024", receita: 257400000, despesa: 254800000, aPagar: 28200000 },
  { year: "2025", receita: 278150000, despesa: 271400000, aPagar: 31500000 }, // Parcial
  { year: "2026", receita: 295000000, despesa: 285000000, aPagar: 35000000 }, // Projetada
];

function formatCompact(value: number) {
  if (value >= 1000000) return `R$ ${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `R$ ${(value / 1000).toFixed(0)}k`;
  return `R$ ${value}`;
}

export function HomeDashboard() {
  const currentYearData = HISTORICAL_DATA[5]; // 2025
  const lastYearData = HISTORICAL_DATA[4]; // 2024
  
  const healthScore = 88; // Placeholder transparency/health index

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Principal: Receita vs Despesa Area Chart */}
      <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h3 className="font-headline text-lg font-bold text-slate-900">Saúde Financeira Municipal</h3>
            <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Receitas vs Despesas (2020 - 2026)</p>
          </div>
          <div className="flex gap-4">
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-emerald-500" />
              <span className="text-[10px] font-bold text-slate-600 uppercase">Receita</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-slate-900" />
              <span className="text-[10px] font-bold text-slate-600 uppercase">Despesa</span>
            </div>
          </div>
        </div>
        
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={HISTORICAL_DATA}>
              <defs>
                <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="year" 
                axisLine={false} 
                tickLine={false} 
                tick={{fontSize: 12, fill: '#64748b', fontWeight: 500}} 
                dy={10}
              />
              <YAxis 
                hide 
                domain={['dataMin - 20000000', 'auto']}
              />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                formatter={(value: number) => [formatCompact(value), '']}
              />
              <Area 
                type="monotone" 
                dataKey="receita" 
                stroke="#10b981" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorReceita)" 
              />
              <Area 
                type="monotone" 
                dataKey="despesa" 
                stroke="#0f172a" 
                strokeWidth={3}
                fill="transparent"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Sidebar: Restos a Pagar */}
      <div className="flex flex-col gap-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex-1">
          <h3 className="font-headline text-lg font-bold text-slate-900 mb-1">Dívida Ativa (A Pagar)</h3>
          <p className="text-xs text-slate-500 mb-4 font-medium uppercase tracking-wider">Restos a Pagar Acumulados</p>
          
          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={HISTORICAL_DATA.slice(2)}>
                <Tooltip 
                   cursor={{fill: '#f8fafc'}}
                   contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                   formatter={(value: number) => [formatCompact(value), '']}
                />
                <Bar 
                  dataKey="aPagar" 
                  fill="#f59e0b" 
                  radius={[4, 4, 0, 0]}
                  barSize={24}
                />
                <XAxis dataKey="year" hide />
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          <div className="mt-4 flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-700">Meta 2026</span>
            <span className="text-sm font-bold text-amber-600">Redução de 12%</span>
          </div>
        </div>

        {/* Small KPIs */}
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-2xl border border-slate-900 bg-slate-900 p-4 text-white">
             <Activity className="h-5 w-5 mb-2 text-emerald-400" />
             <div className="text-2xl font-black">{healthScore}%</div>
             <div className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Score Transparência</div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
             <TrendingUp className="h-5 w-5 mb-2 text-blue-500" />
             <div className="text-2xl font-black text-slate-900">8.2%</div>
             <div className="text-[10px] uppercase font-bold tracking-widest text-slate-500">Cresc. Receita</div>
          </div>
        </div>
      </div>
    </div>
  );
}
