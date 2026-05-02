import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { TopBar } from '@/components/layout/top-bar';
import { formatDate } from '@/lib/utils';
import { Megaphone, MessageCircle, Mail, Star, Send, ArrowRight } from 'lucide-react';

export default async function MarketingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from('user_profiles').select('organization_id').eq('id', user!.id).single();
  const { data: hotels } = await supabase
    .from('hotels').select('id').eq('organization_id', profile?.organization_id).limit(1);
  if (!hotels?.[0]) return null;

  const [{ data: campaigns }, { data: reviews }] = await Promise.all([
    supabase.from('marketing_campaigns').select('*').eq('hotel_id', hotels[0].id).order('created_at', { ascending: false }).limit(10),
    supabase.from('reviews').select('*').eq('hotel_id', hotels[0].id).order('created_at', { ascending: false }).limit(10),
  ]);

  const avgRating = reviews?.length ? (reviews.reduce((s: number, r: any) => s + r.rating, 0) / reviews.length).toFixed(1) : '—';

  return (
    <div className="container max-w-7xl py-8 animate-fade-in">
      <TopBar title="การตลาด" description="Campaigns รีวิว และการวิเคราะห์" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="hover:border-emerald-300 transition-colors cursor-pointer group">
          <CardContent className="p-5">
            <div className="h-10 w-10 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center mb-3">
              <MessageCircle className="h-5 w-5" />
            </div>
            <div className="font-medium mb-1">LINE Broadcast</div>
            <p className="text-xs text-muted-foreground mb-4">ส่งโปรโมชั่นถึงผู้ติดตาม LINE OA</p>
            <Button size="sm" variant="outline" className="w-full">
              สร้าง campaign <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </CardContent>
        </Card>
        <Card className="hover:border-blue-300 transition-colors cursor-pointer group">
          <CardContent className="p-5">
            <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 flex items-center justify-center mb-3">
              <Mail className="h-5 w-5" />
            </div>
            <div className="font-medium mb-1">Email Marketing</div>
            <p className="text-xs text-muted-foreground mb-4">Newsletter ถึงแขกเก่า</p>
            <Button size="sm" variant="outline" className="w-full">
              สร้าง campaign <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </CardContent>
        </Card>
        <Card className="hover:border-purple-300 transition-colors cursor-pointer group">
          <CardContent className="p-5">
            <div className="h-10 w-10 rounded-lg bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 flex items-center justify-center mb-3">
              <Megaphone className="h-5 w-5" />
            </div>
            <div className="font-medium mb-1">SMS Campaign</div>
            <p className="text-xs text-muted-foreground mb-4">SMS ยืนยัน reminder check-in</p>
            <Button size="sm" variant="outline" className="w-full">
              สร้าง campaign <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Campaigns ล่าสุด</CardTitle>
            <CardDescription>ผลลัพธ์การส่งและการเปิด</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {(campaigns?.length || 0) === 0 ? (
              <EmptyState icon={Send} title="ยังไม่มี campaign" description="สร้าง campaign แรกเพื่อโปรโมตโรงแรม" />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-border bg-secondary/30">
                    <tr>
                      <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground">ชื่อ</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">ประเภท</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">ส่ง</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">เปิด</th>
                      <th className="text-right px-6 py-3 text-xs font-medium text-muted-foreground">คลิก</th>
                    </tr>
                  </thead>
                  <tbody>
                    {campaigns?.map((c: any) => (
                      <tr key={c.id} className="border-b border-border/50">
                        <td className="px-6 py-3 font-medium">{c.name}</td>
                        <td className="px-4 py-3"><Badge variant="secondary" className="text-2xs">{c.type}</Badge></td>
                        <td className="px-4 py-3 text-right ticker">{c.sent_count}</td>
                        <td className="px-4 py-3 text-right ticker">{c.opened_count}</td>
                        <td className="px-6 py-3 text-right ticker">{c.clicked_count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                  รีวิวล่าสุด
                </CardTitle>
                <CardDescription>คะแนนเฉลี่ย {avgRating} / 5.0</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {(reviews?.length || 0) === 0 ? (
              <EmptyState icon={Star} title="ยังไม่มีรีวิว" description="รีวิวจาก OTA จะแสดงที่นี่อัตโนมัติ" />
            ) : (
              <div className="space-y-4">
                {reviews?.map((r: any) => (
                  <div key={r.id} className="pb-4 border-b border-border last:border-0 last:pb-0">
                    <div className="flex justify-between items-start mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className="text-amber-500">{'★'.repeat(r.rating)}<span className="text-muted">{'★'.repeat(5 - r.rating)}</span></div>
                        <Badge variant="secondary" className="text-2xs">{r.source}</Badge>
                      </div>
                      <span className="text-2xs text-muted-foreground">{formatDate(r.created_at)}</span>
                    </div>
                    {r.title && <div className="font-medium text-sm mb-1">{r.title}</div>}
                    <p className="text-sm text-muted-foreground line-clamp-2">{r.content}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
