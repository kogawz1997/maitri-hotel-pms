'use client';

import { useMemo, useState } from 'react';
import { BedDouble, CalendarDays, Loader2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { formatCurrency } from '@/lib/utils';
import type { Hotel, RoomType } from '@/types';

type Quote = { nights: number; totalPrice: number; pricePerNight: number; available: number };

function addDaysForInput(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export function BookingEngine({ hotel, roomTypes }: { hotel: Hotel; roomTypes: RoomType[] }) {
  const [roomTypeId, setRoomTypeId] = useState(roomTypes[0]?.id ?? '');
  const [checkIn, setCheckIn] = useState(addDaysForInput(1));
  const [checkOut, setCheckOut] = useState(addDaysForInput(2));
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [guest, setGuest] = useState({ firstName: '', lastName: '', email: '', phone: '', nationality: 'TH', specialRequests: '' });
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loadingQuote, setLoadingQuote] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const selectedRoomType = useMemo(() => roomTypes.find(rt => rt.id === roomTypeId), [roomTypes, roomTypeId]);
  const canSubmit = roomTypeId && checkIn && checkOut && guest.firstName && (guest.email || guest.phone) && quote && quote.available > 0;

  async function fetchQuote() {
    setMessage(null);
    setQuote(null);
    if (!roomTypeId || !checkIn || !checkOut) return setMessage('กรุณาเลือกวันที่และประเภทห้องให้ครบ');
    if (new Date(checkOut) <= new Date(checkIn)) return setMessage('วันเช็คเอาท์ต้องหลังวันเช็คอิน');

    setLoadingQuote(true);
    try {
      const response = await fetch('/api/bookings/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hotelId: hotel.id, roomTypeId, checkIn, checkOut }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'ไม่สามารถคำนวณราคาได้');
      setQuote(data);
    } catch (error: any) {
      setMessage(error.message || 'เกิดข้อผิดพลาด');
    } finally {
      setLoadingQuote(false);
    }
  }

  async function createReservation() {
    if (!canSubmit || !selectedRoomType || !quote) return;
    setSubmitting(true);
    setMessage(null);
    try {
      const response = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hotelId: hotel.id,
          roomTypeId,
          checkIn,
          checkOut,
          numAdults: adults,
          numChildren: children,
          totalAmount: quote.totalPrice,
          firstName: guest.firstName,
          lastName: guest.lastName,
          email: guest.email,
          phone: guest.phone,
          nationality: guest.nationality,
          specialRequests: guest.specialRequests,
          source: 'direct',
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'จองไม่สำเร็จ');
      setMessage(`จองสำเร็จ รหัสการจอง: ${data.reservation?.reservation_code || data.reservation?.id}`);
    } catch (error: any) {
      setMessage(error.message || 'เกิดข้อผิดพลาด');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-cream/40 px-4 py-8 dark:bg-background">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <p className="text-sm text-muted-foreground">จองตรงกับโรงแรม</p>
          <h1 className="mt-2 font-display text-3xl font-semibold">{hotel.name}</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">เลือกห้อง ตรวจสอบราคา และส่งคำขอจองได้ทันที ระบบจะบันทึกเข้าหลังบ้านของโรงแรม</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <Card>
            <CardHeader>
              <CardTitle>รายละเอียดการเข้าพัก</CardTitle>
              <CardDescription>ข้อมูลนี้ใช้สร้าง booking ในระบบ PMS</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <Select label="ประเภทห้อง" value={roomTypeId} onChange={e => setRoomTypeId(e.target.value)}>
                  {roomTypes.map(rt => <option key={rt.id} value={rt.id}>{rt.name} · {formatCurrency(Number(rt.base_rate), hotel.currency)}</option>)}
                </Select>
                <div className="grid grid-cols-2 gap-3">
                  <Input aria-label="Adults" type="number" min={1} value={adults} onChange={e => setAdults(Number(e.target.value))} />
                  <Input aria-label="Children" type="number" min={0} value={children} onChange={e => setChildren(Number(e.target.value))} />
                </div>
                <Input label="เช็คอิน" type="date" value={checkIn} onChange={e => setCheckIn(e.target.value)} />
                <Input label="เช็คเอาท์" type="date" value={checkOut} onChange={e => setCheckOut(e.target.value)} />
              </div>
              <Button type="button" variant="outline" onClick={fetchQuote} disabled={loadingQuote || !roomTypeId}>
                {loadingQuote ? <Loader2 className="animate-spin" /> : <CalendarDays />} ตรวจราคาและห้องว่าง
              </Button>

              <div className="grid gap-4 md:grid-cols-2">
                <Input label="ชื่อ" value={guest.firstName} onChange={e => setGuest({ ...guest, firstName: e.target.value })} />
                <Input label="นามสกุล" value={guest.lastName} onChange={e => setGuest({ ...guest, lastName: e.target.value })} />
                <Input label="อีเมล" type="email" value={guest.email} onChange={e => setGuest({ ...guest, email: e.target.value })} />
                <Input label="เบอร์โทร" value={guest.phone} onChange={e => setGuest({ ...guest, phone: e.target.value })} />
                <Input label="สัญชาติ" value={guest.nationality} onChange={e => setGuest({ ...guest, nationality: e.target.value })} />
                <Input label="คำขอพิเศษ" value={guest.specialRequests} onChange={e => setGuest({ ...guest, specialRequests: e.target.value })} />
              </div>

              {message && <div className="rounded-lg border bg-secondary/50 p-3 text-sm">{message}</div>}
            </CardContent>
          </Card>

          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><BedDouble className="h-5 w-5" /> สรุปการจอง</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-xl bg-secondary/50 p-4 text-sm">
                <div className="font-medium">{selectedRoomType?.name || 'ยังไม่เลือกห้อง'}</div>
                <div className="mt-1 text-muted-foreground">{checkIn} → {checkOut}</div>
                <div className="mt-1 flex items-center gap-1 text-muted-foreground"><Users className="h-3.5 w-3.5" /> {adults} ผู้ใหญ่ · {children} เด็ก</div>
              </div>
              {quote ? (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span>จำนวนคืน</span><strong>{quote.nights}</strong></div>
                  <div className="flex justify-between"><span>ห้องว่าง</span><strong>{quote.available}</strong></div>
                  <div className="flex justify-between text-lg"><span>รวม</span><strong>{formatCurrency(quote.totalPrice, hotel.currency)}</strong></div>
                </div>
              ) : <p className="text-sm text-muted-foreground">กดตรวจราคาเพื่อดูยอดรวม</p>}
              <Button className="w-full" onClick={createReservation} disabled={!canSubmit || submitting}>
                {submitting ? <Loader2 className="animate-spin" /> : null} ยืนยันการจอง
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
