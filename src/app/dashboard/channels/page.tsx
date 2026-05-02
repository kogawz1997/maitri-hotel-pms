import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TopBar } from '@/components/layout/top-bar';
import { Check, Clock, Info, Globe2, Zap, ArrowRight } from 'lucide-react';

const SUPPORTED_CHANNELS = [
  { id: 'booking_com', name: 'Booking.com', logo: '🏨', setupTime: '4-12 สัปดาห์', commission: '15-18%', via: 'Direct API' },
  { id: 'agoda', name: 'Agoda', logo: '🏯', setupTime: '6-16 สัปดาห์', commission: '15-18%', via: 'YCS API' },
  { id: 'airbnb', name: 'Airbnb', logo: '🏡', setupTime: '2-4 สัปดาห์', commission: '3% + service', via: 'Software Partner' },
  { id: 'expedia', name: 'Expedia', logo: '✈️', setupTime: '4-8 สัปดาห์', commission: '15-25%', via: 'Direct' },
  { id: 'trip_com', name: 'Trip.com', logo: '🌏', setupTime: '4-8 สัปดาห์', commission: '13-15%', via: 'Direct' },
  { id: 'hostelworld', name: 'Hostelworld', logo: '🎒', setupTime: '2-4 สัปดาห์', commission: '12-15%', via: 'Direct' },
];

export default async function ChannelsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from('user_profiles').select('organization_id').eq('id', user!.id).single();
  const { data: hotels } = await supabase
    .from('hotels').select('id').eq('organization_id', profile?.organization_id).limit(1);
  if (!hotels?.[0]) return null;

  const { data: connections } = await supabase
    .from('channel_connections').select('*').eq('hotel_id', hotels[0].id);

  const connMap = new Map(connections?.map((c: any) => [c.channel, c]));

  return (
    <div className="container max-w-7xl py-8 animate-fade-in">
      <TopBar title="Channel Manager" description="Sync ราคาและห้องว่างกับ OTA แบบ real-time" />

      {/* Strategy callout */}
      <Card className="mb-6 border-accent/30 bg-accent/5">
        <CardContent className="p-5">
          <div className="flex gap-3">
            <div className="h-9 w-9 rounded-lg bg-accent/20 flex items-center justify-center shrink-0">
              <Info className="h-4 w-4 text-accent" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-sm mb-1.5">เลือกวิธีเริ่มต้นของคุณ</h3>
              <div className="grid md:grid-cols-2 gap-4 mt-3">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <Zap className="h-3.5 w-3.5 text-accent" />
                    <span className="font-medium text-sm">Aggregator (แนะนำ)</span>
                    <Badge variant="success" className="text-2xs">เร็ว</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    ใช้ HotelRunner / MyAllocator เปิดได้ภายใน 2-7 วัน ค่าบริการ ~$30-50/เดือน
                  </p>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <Globe2 className="h-3.5 w-3.5" />
                    <span className="font-medium text-sm">Direct API</span>
                    <Badge variant="secondary" className="text-2xs">ลด commission</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    เชื่อมตรงกับ OTA ใช้เวลาอนุมัติ 4-16 สัปดาห์ ไม่มีค่าบริการเพิ่ม
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {SUPPORTED_CHANNELS.map(ch => {
          const conn: any = connMap.get(ch.id);
          const isConnected = !!conn;
          return (
            <Card key={ch.id} className={isConnected ? 'border-emerald-300 bg-emerald-50/30 dark:bg-emerald-950/10' : ''}>
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-start gap-3">
                    <div className="text-3xl">{ch.logo}</div>
                    <div>
                      <div className="font-display text-lg font-medium">{ch.name}</div>
                      <div className="text-2xs text-muted-foreground">{ch.via}</div>
                    </div>
                  </div>
                  {isConnected ? (
                    <Badge variant="success">
                      <Check className="h-3 w-3 mr-1" /> เชื่อมแล้ว
                    </Badge>
                  ) : (
                    <Badge variant="outline">
                      <Clock className="h-3 w-3 mr-1" /> ยังไม่เชื่อม
                    </Badge>
                  )}
                </div>
                <div className="space-y-1.5 text-2xs text-muted-foreground mb-4">
                  <div className="flex justify-between">
                    <span>อนุมัติ:</span>
                    <span className="text-foreground">{ch.setupTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>คอมมิชชั่น:</span>
                    <span className="text-foreground">{ch.commission}</span>
                  </div>
                </div>
                <Button size="sm" variant={isConnected ? 'outline' : 'default'} className="w-full">
                  {isConnected ? 'จัดการ' : 'เชื่อมต่อ'}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
