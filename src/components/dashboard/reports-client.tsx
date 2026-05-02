'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { TopBar } from '@/components/layout/top-bar';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { formatCurrency } from '@/lib/utils';
import { format, subDays, eachDayOfInterval } from 'date-fns';
import { th } from 'date-fns/locale';
import { TrendingUp, TrendingDown, DollarSign, Users, Bed, Activity } from 'lucide-react';

const CHART_COLORS = ['#C66A30', '#7A8471', '#B8956A', '#2A2522', '#A4522A', '#854329'];

export function ReportsClient({ hotelId }: { hotelId: string }) {
  const supabase = createClient();
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [channelMix, setChannelMix] = useState<any[]>([]);
  const [kpis, setKpis] = useState({ adr: 0, revpar: 0, occupancy: 0, totalRevenue: 0 });

  useEffect(() => {
    async function load() {
      const today = new Date();
      const days = eachDayOfInterval({ start: subDays(today, 30), end: today });

      const { data: resvs } = await supabase
        .from('reservations')
        .select('check_in, check_out, total_amount, source, nights, status')
        .eq('hotel_id', hotelId)
        .gte('check_in', format(subDays(today, 30), 'yyyy-MM-dd'))
        .neq('status', 'cancelled');

      const { data: rooms } = await supabase.from('rooms').select('id').eq('hotel_id', hotelId);
      const totalRooms = rooms?.length || 1;

      const dailyData = days.map(day => {
        const dayStr = format(day, 'yyyy-MM-dd');
        const dayResvs = resvs?.filter((r: any) => r.check_in <= dayStr && r.check_out > dayStr) || [];
        const revenue = dayResvs.reduce((s: number, r: any) => s + (Number(r.total_amount) / r.nights || 0), 0);
        const occupied = dayResvs.length;
        return {
          date: format(day, 'd/M'),
          revenue,
          occupancy: (occupied / totalRooms) * 100,
        };
      });

      setRevenueData(dailyData);

      const channels: Record<string, number> = {};
      resvs?.forEach((r: any) => {
        channels[r.source] = (channels[r.source] || 0) + Number(r.total_amount);
      });
      setChannelMix(Object.entries(channels).map(([name, value]) => ({ name, value })));

      const totalRevenue = resvs?.reduce((s: number, r: any) => s + Number(r.total_amount), 0) || 0;
      const totalNights = resvs?.reduce((s: number, r: any) => s + r.nights, 0) || 0;
      const avgOccupancy = dailyData.reduce((s, d) => s + d.occupancy, 0) / dailyData.length;

      setKpis({
        adr: totalNights > 0 ? totalRevenue / totalNights : 0,
        revpar: totalRevenue / (totalRooms * 30),
        occupancy: avgOccupancy,
        totalRevenue,
      });
    }
    load();
  }, [hotelId]);

  return (
    <div className="container max-w-7xl py-8 animate-fade-in">
      <TopBar title="รายงาน" description="ข้อมูล 30 วันล่าสุด" />

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KPICard label="รายได้รวม" value={formatCurrency(kpis.totalRevenue)} icon={DollarSign} />
        <KPICard label="ADR" sublabel="ค่าห้องเฉลี่ย" value={formatCurrency(kpis.adr)} icon={Bed} />
        <KPICard label="RevPAR" sublabel="รายได้ต่อห้องว่าง" value={formatCurrency(kpis.revpar)} icon={Activity} />
        <KPICard label="Occupancy" sublabel="อัตราเข้าพัก" value={`${kpis.occupancy.toFixed(1)}%`} icon={Users} />
      </div>

      {/* Revenue chart */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>รายได้รายวัน</CardTitle>
          <CardDescription>30 วันที่ผ่านมา</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#C66A30" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#C66A30" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <Tooltip
                formatter={(v: any) => formatCurrency(v)}
                contentStyle={{
                  background: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '0.5rem',
                  fontSize: '12px',
                }}
              />
              <Area type="monotone" dataKey="revenue" stroke="#C66A30" strokeWidth={2} fill="url(#colorRevenue)" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Occupancy รายวัน</CardTitle>
            <CardDescription>เปอร์เซ็นต์การเข้าพัก</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={revenueData}>
                <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <Tooltip
                  formatter={(v: any) => `${v.toFixed(0)}%`}
                  contentStyle={{
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '0.5rem',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="occupancy" fill="#7A8471" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>สัดส่วนช่องทาง</CardTitle>
            <CardDescription>รายได้แบ่งตามแหล่งที่มา</CardDescription>
          </CardHeader>
          <CardContent>
            {channelMix.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-12">ยังไม่มีข้อมูล</p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={channelMix} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={2}>
                    {channelMix.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip
                    formatter={(v: any) => formatCurrency(v)}
                    contentStyle={{
                      background: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '0.5rem',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
            <div className="flex flex-wrap gap-3 mt-4 justify-center">
              {channelMix.map((c, i) => (
                <div key={c.name} className="flex items-center gap-1.5 text-xs">
                  <div className="h-2 w-2 rounded-sm" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                  <span>{c.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function KPICard({ label, sublabel, value, icon: Icon }: any) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="text-xs text-muted-foreground">{label}</div>
            {sublabel && <div className="text-2xs text-muted-foreground/60">{sublabel}</div>}
          </div>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="font-display text-2xl font-medium ticker tracking-tight">{value}</div>
      </CardContent>
    </Card>
  );
}
