import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, BarChart2 } from "lucide-react";
import { useGetSkillForecast } from "@workspace/api-client-react";

export default function SkillForecastCard() {
  const { data: forecast, isLoading } = useGetSkillForecast();

  if (isLoading) return <div className="h-32 bg-muted/50 rounded-2xl animate-pulse" />;
  if (!forecast) return null;

  type ForecastItem = { skill: string; trend: string; changePercent: number; volume: number };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <BarChart2 className="h-4 w-4 text-[#4d0011]" />
        <span className="text-xs font-bold text-[#4d0011] uppercase tracking-widest">Skill Forecast</span>
        <span className="text-[10px] text-muted-foreground ml-auto">{forecast.weekOf}</span>
      </div>
      {forecast.aiSummary && (
        <p className="text-xs text-muted-foreground italic mb-3 leading-relaxed">"{forecast.aiSummary}"</p>
      )}
      <div className="space-y-2">
        {(forecast.forecasts as ForecastItem[]).slice(0, 5).map((item) => (
          <div key={item.skill} className="flex items-center gap-2">
            <span className="text-xs font-semibold w-24 truncate text-foreground">{item.skill}</span>
            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all ${item.trend === "rising" ? "bg-green-500" : "bg-red-400"}`}
                style={{ width: `${Math.min(100, Math.max(10, (item.volume / 60) * 100))}%` }} />
            </div>
            <div className={`flex items-center gap-0.5 text-[10px] font-bold w-14 justify-end ${item.trend === "rising" ? "text-green-600" : "text-red-500"}`}>
              {item.trend === "rising" ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {item.changePercent > 0 ? "+" : ""}{item.changePercent}%
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
