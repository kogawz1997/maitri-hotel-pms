import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TopBar } from '@/components/layout/top-bar';
import { EmptyState } from '@/components/ui/empty-state';
import { Award, Star, Crown } from 'lucide-react';

const TIERS = [
  {
    name: 'Bronze', icon: Award, points: 0,
    color: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300',
    benefits: ['Welcome drink', 'Late check-out 1 ชม.', 'สะสมแต้ม 1x']
  },
  {
    name: 'Silver', icon: Star, points: 5000,
    color: 'bg-slate-100 text-slate-700 dark:bg-slate-950 dark:text-slate-300',
    benefits: ['ส่วนลด 10%', 'Free breakfast', 'Late check-out 2 ชม.', 'สะสมแต้ม 1.5x']
  },
  {
    name: 'Gold', icon: Crown, points: 20000,
    color: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
    benefits: ['ส่วนลด 15%', 'Room upgrade', 'Free spa 1 ครั้ง', 'สะสมแต้ม 2x']
  },
];

export default async function LoyaltyPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from('user_profiles').select('organization_id').eq('id', user!.id).single();
  const { data: hotels } = await supabase
    .from('hotels').select('id').eq('organization_id', profile?.organization_id).limit(1);
  if (!hotels?.[0]) return null;

  const { data: topGuests } = await supabase
    .from('guests')
    .select('first_name, last_name, loyalty_points, loyalty_tier, total_stays')
    .eq('hotel_id', hotels[0].id)
    .order('loyalty_points', { ascending: false })
    .limit(10);

  return (
    <div className="container max-w-7xl py-8 animate-fade-in">
      <TopBar title="Loyalty Program" description="โปรแกรมสะสมแต้มและสมาชิก" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {TIERS.map(tier => {
          const Icon = tier.icon;
          return (
            <Card key={tier.name}>
              <CardContent className="p-6">
                <div className={`h-12 w-12 rounded-xl flex items-center justify-center mb-4 ${tier.color}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div className="font-display text-2xl font-medium mb-1">{tier.name}</div>
                <div className="text-xs text-muted-foreground mb-4">≥ {tier.points.toLocaleString()} แต้ม</div>
                <ul className="space-y-1.5">
                  {tier.benefits.map(b => (
                    <li key={b} className="text-xs flex items-start gap-2">
                      <span className="text-accent mt-0.5">·</span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top Members</CardTitle>
          <CardDescription>แขกที่สะสมแต้มสูงสุด</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {(topGuests?.length || 0) === 0 ? (
            <EmptyState icon={Award} title="ยังไม่มีสมาชิก" description="สมาชิกจะเพิ่มเองเมื่อมีการจอง" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-secondary/30">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground">อันดับ</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">ชื่อ</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Tier</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">แต้ม</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">เข้าพัก</th>
                  </tr>
                </thead>
                <tbody>
                  {topGuests?.map((g: any, i: number) => (
                    <tr key={i} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                      <td className="px-6 py-3 font-mono text-xs">#{i + 1}</td>
                      <td className="px-4 py-3 font-medium">{g.first_name} {g.last_name || ''}</td>
                      <td className="px-4 py-3"><Badge variant="secondary" className="text-2xs">{g.loyalty_tier}</Badge></td>
                      <td className="px-4 py-3 ticker">{g.loyalty_points?.toLocaleString() || 0}</td>
                      <td className="px-4 py-3">{g.total_stays || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
