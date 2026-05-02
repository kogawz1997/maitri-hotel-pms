'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { TopBar } from '@/components/layout/top-bar';
import {
  Building2, Plug, MessageCircle, CreditCard, FileText, Calculator, Globe2, ArrowRight,
} from 'lucide-react';
import { toast } from 'sonner';

const TABS = [
  { key: 'hotel', label: 'ข้อมูลโรงแรม', icon: Building2 },
  { key: 'integrations', label: 'การเชื่อมต่อ', icon: Plug },
];

export function SettingsClient({ hotel, profile }: { hotel: any; profile: any }) {
  const [activeTab, setActiveTab] = useState<'hotel' | 'integrations'>('hotel');

  return (
    <div className="container max-w-4xl py-8 animate-fade-in">
      <TopBar title="ตั้งค่า" description="จัดการข้อมูลโรงแรมและการเชื่อมต่อ" />

      <div className="flex gap-1 mb-6 border-b border-border">
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px flex items-center gap-2 ${
                activeTab === tab.key
                  ? 'border-accent text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'hotel' && <HotelInfoTab hotel={hotel} />}
      {activeTab === 'integrations' && <IntegrationsTab />}
    </div>
  );
}

function HotelInfoTab({ hotel }: { hotel: any }) {
  const supabase = createClient();
  const [saving, setSaving] = useState(false);

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    const { error } = await supabase.from('hotels').update({
      name: fd.get('name'),
      type: fd.get('type'),
      address: fd.get('address'),
      city: fd.get('city'),
      phone: fd.get('phone'),
      email: fd.get('email'),
      website: fd.get('website'),
      tax_id: fd.get('tax_id'),
      check_in_time: fd.get('check_in_time'),
      check_out_time: fd.get('check_out_time'),
      currency: fd.get('currency'),
      vat_rate: Number(fd.get('vat_rate')),
    }).eq('id', hotel.id);
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success('บันทึกเรียบร้อย');
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>ข้อมูลโรงแรม</CardTitle>
        <CardDescription>ข้อมูลพื้นฐาน ใช้ในใบกำกับและการสื่อสารกับแขก</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSave} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input name="name" label="ชื่อโรงแรม" defaultValue={hotel.name} required />
            <Select name="type" label="ประเภท" defaultValue={hotel.type}>
              <option value="hotel">Hotel</option>
              <option value="hostel">Hostel</option>
              <option value="pool_villa">Pool Villa</option>
              <option value="serviced_apartment">Serviced Apartment</option>
              <option value="resort">Resort</option>
              <option value="boutique">Boutique</option>
            </Select>
          </div>
          <Input name="address" label="ที่อยู่" defaultValue={hotel.address || ''} />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input name="city" label="จังหวัด" defaultValue={hotel.city || ''} />
            <Input name="phone" label="เบอร์โทร" defaultValue={hotel.phone || ''} />
            <Input name="email" type="email" label="อีเมล" defaultValue={hotel.email || ''} />
          </div>
          <Input name="website" label="Website" defaultValue={hotel.website || ''} placeholder="https://..." />
          <Input
            name="tax_id"
            label="เลขประจำตัวผู้เสียภาษี"
            hint="13 หลัก สำหรับใบกำกับภาษี"
            defaultValue={hotel.tax_id || ''}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input name="check_in_time" type="time" label="เวลา Check-in" defaultValue={hotel.check_in_time} />
            <Input name="check_out_time" type="time" label="เวลา Check-out" defaultValue={hotel.check_out_time} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input name="currency" label="สกุลเงิน" defaultValue={hotel.currency} />
            <Input name="vat_rate" type="number" step="0.01" label="VAT Rate" defaultValue={hotel.vat_rate} hint="0.07 = 7%" />
          </div>
          <div className="pt-2">
            <Button type="submit" disabled={saving}>
              {saving ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function IntegrationsTab() {
  const integrations = [
    { name: 'LINE Official Account', description: 'รับ-ส่งข้อความผ่าน LINE OA', icon: MessageCircle, status: 'pending' },
    { name: 'WhatsApp Business', description: 'รับข้อความแขกชาวต่างชาติ', icon: MessageCircle, status: 'pending' },
    { name: 'Channel Manager', description: 'Sync OTA (Booking, Agoda, Airbnb)', icon: Globe2, status: 'pending' },
    { name: 'Omise Payment', description: 'รับชำระเงิน PromptPay/บัตรเครดิต', icon: CreditCard, status: 'pending' },
    { name: 'e-Tax Invoice', description: 'ออกใบกำกับภาษีอิเล็กทรอนิกส์', icon: FileText, status: 'pending' },
    { name: 'PEAK / FlowAccount', description: 'เชื่อมระบบบัญชี', icon: Calculator, status: 'pending' },
  ];

  return (
    <div className="space-y-3">
      {integrations.map(i => {
        const Icon = i.icon;
        return (
          <Card key={i.name}>
            <CardContent className="p-5 flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                <Icon className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-medium">{i.name}</span>
                  <Badge variant={i.status === 'connected' ? 'success' : 'outline'} className="text-2xs">
                    {i.status === 'connected' ? 'เชื่อมแล้ว' : 'ยังไม่ได้ตั้งค่า'}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">{i.description}</p>
              </div>
              <Button size="sm" variant="outline">
                ตั้งค่า <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
