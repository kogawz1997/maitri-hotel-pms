import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { TopBar } from '@/components/layout/top-bar';
import { formatCurrency } from '@/lib/utils';
import { Search, Users, Star, Mail, Phone, Globe2 } from 'lucide-react';

export default async function GuestsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('organization_id')
    .eq('id', user!.id)
    .single();
  const { data: hotels } = await supabase
    .from('hotels')
    .select('id')
    .eq('organization_id', profile?.organization_id)
    .limit(1);
  if (!hotels?.[0]) return null;

  let query = supabase.from('guests').select('*').eq('hotel_id', hotels[0].id);
  if (q) {
    query = query.or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%`);
  }
  const { data: guests } = await query.order('total_revenue', { ascending: false }).limit(100);

  const totalGuests = guests?.length || 0;
  const vipCount = guests?.filter(g => g.vip_status).length || 0;
  const totalRevenue = guests?.reduce((s, g) => s + Number(g.total_revenue || 0), 0) || 0;

  return (
    <div className="container max-w-7xl py-8 animate-fade-in">
      <TopBar title="ฐานข้อมูลแขก" description={`${totalGuests} แขกในระบบ`} />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card><CardContent className="p-5">
          <div className="text-xs text-muted-foreground mb-1">จำนวนแขก</div>
          <div className="font-display text-2xl font-medium ticker">{totalGuests}</div>
        </CardContent></Card>
        <Card><CardContent className="p-5">
          <div className="text-xs text-muted-foreground mb-1">VIP</div>
          <div className="font-display text-2xl font-medium ticker flex items-center gap-1">
            {vipCount} <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
          </div>
        </CardContent></Card>
        <Card><CardContent className="p-5">
          <div className="text-xs text-muted-foreground mb-1">รายได้รวม</div>
          <div className="font-display text-2xl font-medium ticker">{formatCurrency(totalRevenue)}</div>
        </CardContent></Card>
      </div>

      <Card>
        <div className="p-4 border-b border-border">
          <form method="GET" className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              name="q"
              defaultValue={q}
              placeholder="ค้นหาชื่อ อีเมล หรือเบอร์โทร..."
              className="w-full pl-9 pr-3 py-2 bg-secondary border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </form>
        </div>

        {(guests?.length || 0) === 0 ? (
          <EmptyState
            icon={Users}
            title={q ? 'ไม่พบแขก' : 'ยังไม่มีแขกในระบบ'}
            description={q ? 'ลองค้นหาด้วยคำอื่น' : 'แขกจะถูกเพิ่มอัตโนมัติเมื่อมีการจอง'}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-secondary/30">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground">ชื่อ</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">ติดต่อ</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">สัญชาติ</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">เข้าพัก</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">รายได้</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Tier</th>
                </tr>
              </thead>
              <tbody>
                {guests?.map(g => (
                  <tr key={g.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors group">
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium">
                          {g.first_name?.[0]?.toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium flex items-center gap-1.5">
                            {g.first_name} {g.last_name || ''}
                            {g.vip_status && <Star className="h-3 w-3 text-amber-500 fill-amber-500" />}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {g.email && <div className="flex items-center gap-1"><Mail className="h-3 w-3" /> {g.email}</div>}
                      {g.phone && <div className="flex items-center gap-1 mt-0.5"><Phone className="h-3 w-3" /> {g.phone}</div>}
                    </td>
                    <td className="px-4 py-3 text-xs">{g.nationality || <span className="text-muted-foreground">—</span>}</td>
                    <td className="px-4 py-3 text-xs">{g.total_stays || 0} ครั้ง</td>
                    <td className="px-4 py-3 text-sm font-medium ticker">{formatCurrency(g.total_revenue || 0)}</td>
                    <td className="px-4 py-3">
                      <Badge variant={
                        g.loyalty_tier === 'gold' ? 'warning' :
                        g.loyalty_tier === 'silver' ? 'secondary' :
                        'outline'
                      } className="text-2xs">{g.loyalty_tier}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
