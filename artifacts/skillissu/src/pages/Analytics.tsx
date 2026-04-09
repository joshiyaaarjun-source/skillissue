import { motion } from "framer-motion";
import { useGetMyAnalytics, getGetMyAnalyticsQueryKey } from "@workspace/api-client-react";
import BottomNav from "@/components/BottomNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { ArrowUpRight, ArrowDownRight, Activity } from "lucide-react";

export default function Analytics() {
  const { data: analytics, isLoading } = useGetMyAnalytics({ query: { queryKey: getGetMyAnalyticsQueryKey() } });

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] bg-background p-4 pt-12 space-y-6 pb-24">
        <Skeleton className="h-10 w-48 mb-8" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
        </div>
        <Skeleton className="h-[300px] w-full rounded-2xl" />
        <BottomNav />
      </div>
    );
  }

  if (!analytics) return null;

  return (
    <div className="min-h-[100dvh] bg-background pb-24">
      <div className="p-4 pt-12 space-y-6">
        <div className="flex items-center gap-3 px-2">
          <div className="bg-primary/10 p-2 rounded-xl text-primary">
            <Activity className="h-6 w-6" />
          </div>
          <h1 className="text-3xl font-bold">Your Impact</h1>
        </div>

        {/* Top Stats */}
        <div className="grid grid-cols-2 gap-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-primary text-primary-foreground p-4 rounded-2xl shadow-sm"
          >
            <div className="text-sm font-medium opacity-80 mb-1">Total Exchanges</div>
            <div className="text-3xl font-black">{analytics.totalExchanges}</div>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card border border-border p-4 rounded-2xl shadow-sm"
          >
            <div className="text-sm font-medium text-muted-foreground mb-1">Skills Learned</div>
            <div className="text-3xl font-black text-foreground">{analytics.skillsLearned.length}</div>
          </motion.div>
        </div>

        {/* Credit Flow */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 gap-4"
        >
          <Card className="border-none shadow-sm bg-green-50 dark:bg-green-950/30">
            <CardContent className="p-4 flex flex-col items-center text-center">
              <ArrowUpRight className="h-6 w-6 text-green-600 mb-2" />
              <div className="text-2xl font-bold text-green-700 dark:text-green-500">+{analytics.creditsEarned}</div>
              <div className="text-xs font-medium text-green-600/80 mt-1 uppercase tracking-wider">Earned</div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm bg-red-50 dark:bg-red-950/30">
            <CardContent className="p-4 flex flex-col items-center text-center">
              <ArrowDownRight className="h-6 w-6 text-red-600 mb-2" />
              <div className="text-2xl font-bold text-red-700 dark:text-red-500">-{analytics.creditsSpent}</div>
              <div className="text-xs font-medium text-red-600/80 mt-1 uppercase tracking-wider">Spent</div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Chart */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Activity History</CardTitle>
            </CardHeader>
            <CardContent className="px-2 pb-4">
              <div className="h-[250px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.exchangesByMonth} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="month" 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <Tooltip 
                      cursor={{ fill: 'hsl(var(--muted))' }}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    />
                    <Bar 
                      dataKey="count" 
                      fill="#4d0011" 
                      radius={[4, 4, 0, 0]} 
                      barSize={30}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Top Skills Cloud */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Your Top Skills</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {analytics.topSkills.map((stat, idx) => (
                  <div 
                    key={stat.skill}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted border border-border"
                    style={{
                      transform: `scale(${1 - (idx * 0.05)})`,
                      transformOrigin: 'left center'
                    }}
                  >
                    <span className="font-semibold text-sm">{stat.skill}</span>
                    <span className="bg-background text-xs px-1.5 py-0.5 rounded-md font-medium">{stat.count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

      </div>
      <BottomNav />
    </div>
  );
}
