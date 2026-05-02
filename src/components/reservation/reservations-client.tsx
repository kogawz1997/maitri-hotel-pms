'use client';

import { useEffect, useState, useMemo, Fragment } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { TopBar } from '@/components/layout/top-bar';
import {
  ChevronLeft, ChevronRight, Plus, Calendar, List, Filter,
  Bed, ArrowRight, X,
} from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { addDays, format, startOfWeek, isSameDay, isWithinInterval, isToday } from 'date-fns';
import { th } from 'date-fns/locale';
import { toast } from 'sonner';

interface Room { id: string; room_number: string; room_type_id: string; }
interface RoomType { id: string; name: string; base_rate: number; }
interface Reservation {
  id: string; reservation_code: string; status: string;
  check_in: string; check_out: string; room_id?: string;
  total_amount: number; source: string;
  guests: { first_name: string; last_name?: string };
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-100 dark:bg-amber-950 border-amber-300 text-amber-900 dark:text-amber-200',
  confirmed: 'bg-sky-100 dark:bg-sky-950 border-sky-300 text-sky-900 dark:text-sky-200',
  checked_in: 'bg-emerald-100 dark:bg-emerald-950 border-emerald-300 text-emerald-900 dark:text-emerald-200',
  checked_out: 'bg-secondary border-border text-muted-foreground',
  cancelled: 'bg-red-50 dark:bg-red-950/50 border-red-200 text-red-700 dark:text-red-300 line-through opacity-50',
  no_show: 'bg-red-100 dark:bg-red-950 border-red-300 text-red-900 dark:text-red-200',
};

export function ReservationsClient({ hotelId }: { hotelId: string }) {
  const supabase = createClient();
  const [view, setView] = useState<'calendar' | 'list'>('calendar');
  const [startDate, setStartDate] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const days = useMemo(() => Array.from({ length: 14 }, (_, i) => addDays(startDate, i)), [startDate]);

  useEffect(() => { load(); }, [hotelId, startDate]);

  async function load() {
    const [{ data: rs }, { data: rts }, { data: resvs }] = await Promise.all([
      supabase.from('rooms').select('id, room_number, room_type_id').eq('hotel_id', hotelId).order('room_number'),
      supabase.from('room_types').select('id, name, base_rate').eq('hotel_id', hotelId),
      supabase.from('reservations')
        .select('id, reservation_code, status, check_in, check_out, room_id, total_amount, source, guests(first_name, last_name)')
        .eq('hotel_id', hotelId)
        .gte('check_out', format(startDate, 'yyyy-MM-dd'))
        .lte('check_in', format(addDays(startDate, 14), 'yyyy-MM-dd')),
    ]);
    setRooms(rs || []);
    setRoomTypes(rts || []);
    setReservations(resvs as any || []);
    setLoading(false);
  }

  function getReservationForRoomDay(roomId: string, day: Date) {
    return reservations.find(r =>
      r.room_id === roomId &&
      isWithinInterval(day, {
        start: new Date(r.check_in),
        end: addDays(new Date(r.check_out), -1),
      })
    );
  }

  return (
    <div className="container max-w-[1600px] py-8 animate-fade-in">
      <TopBar
        title="การจอง"
        description={`${reservations.length} การจองในช่วง 14 วัน`}
        action={
          <>
            <div className="flex items-center bg-secondary rounded-lg p-1">
              <button
                onClick={() => setView('calendar')}
                className={cn(
                  'px-3 py-1 text-xs font-medium rounded-md transition-colors flex items-center gap-1',
                  view === 'calendar' ? 'bg-card shadow-sm' : 'text-muted-foreground'
                )}
              >
                <Calendar className="h-3.5 w-3.5" /> Calendar
              </button>
              <button
                onClick={() => setView('list')}
                className={cn(
                  'px-3 py-1 text-xs font-medium rounded-md transition-colors flex items-center gap-1',
                  view === 'list' ? 'bg-card shadow-sm' : 'text-muted-foreground'
                )}
              >
                <List className="h-3.5 w-3.5" /> List
              </button>
            </div>
            <Button size="sm" onClick={() => setShowCreateModal(true)}>
              <Plus className="h-3.5 w-3.5" /> จองใหม่
            </Button>
          </>
        }
      />

      {/* Calendar view */}
      {view === 'calendar' && (
        <Card className="overflow-hidden">
          <div className="p-4 border-b border-border bg-secondary/30 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" onClick={() => setStartDate(addDays(startDate, -7))}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => setStartDate(startOfWeek(new Date(), { weekStartsOn: 1 }))}>
                วันนี้
              </Button>
              <Button variant="outline" size="icon" onClick={() => setStartDate(addDays(startDate, 7))}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <span className="ml-3 font-medium text-sm">
                {format(startDate, 'd MMM', { locale: th })} – {format(addDays(startDate, 13), 'd MMM yyyy', { locale: th })}
              </span>
            </div>

            <div className="flex items-center gap-3 text-2xs text-muted-foreground">
              <LegendDot color="bg-sky-300" label="ยืนยันแล้ว" />
              <LegendDot color="bg-emerald-300" label="เช็คอิน" />
              <LegendDot color="bg-amber-300" label="รอยืนยัน" />
            </div>
          </div>

          {rooms.length === 0 ? (
            <EmptyState
              icon={Bed}
              title="ยังไม่มีห้อง"
              description="เพิ่มห้องเพื่อเริ่มรับการจอง"
              action={
                <Button asChild>
                  <a href="/dashboard/rooms">ไปจัดการห้อง <ArrowRight className="h-3.5 w-3.5" /></a>
                </Button>
              }
            />
          ) : (
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-secondary/50">
                    <th className="sticky left-0 bg-secondary/50 backdrop-blur z-10 p-3 border-r border-border min-w-[120px] text-left text-xs font-medium text-muted-foreground">
                      ห้อง
                    </th>
                    {days.map(day => (
                      <th
                        key={day.toString()}
                        className={cn(
                          'p-2 border-r border-border min-w-[90px] text-center font-normal',
                          isToday(day) && 'bg-accent/5'
                        )}
                      >
                        <div className="text-2xs uppercase tracking-wider text-muted-foreground">
                          {format(day, 'EEE', { locale: th })}
                        </div>
                        <div className={cn('font-medium mt-0.5', isToday(day) && 'text-accent')}>
                          {format(day, 'd MMM', { locale: th })}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {roomTypes.map(rt => (
                    <Fragment key={rt.id}>
                      <tr>
                        <td colSpan={15} className="px-3 py-2 sticky left-0 bg-cream/50 dark:bg-secondary/30 text-xs uppercase tracking-wider text-muted-foreground font-medium border-b border-border">
                          {rt.name} · {formatCurrency(rt.base_rate)}/คืน
                        </td>
                      </tr>
                      {rooms.filter(r => r.room_type_id === rt.id).map(room => (
                        <tr key={room.id}>
                          <td className="sticky left-0 bg-card backdrop-blur p-3 border-r border-border font-medium text-sm">
                            {room.room_number}
                          </td>
                          {days.map(day => {
                            const resv = getReservationForRoomDay(room.id, day);
                            const isCheckIn = resv && isSameDay(day, new Date(resv.check_in));
                            return (
                              <td
                                key={day.toString()}
                                className={cn(
                                  'border-r border-b border-border h-14 p-1 relative',
                                  isToday(day) && 'bg-accent/5'
                                )}
                              >
                                {resv && (
                                  <div
                                    className={cn(
                                      'h-full px-2 py-1 rounded-md border text-xs cursor-pointer truncate',
                                      'hover:scale-[1.02] transition-transform',
                                      STATUS_COLORS[resv.status]
                                    )}
                                    title={`${resv.guests?.first_name} ${resv.guests?.last_name || ''} - ${formatCurrency(resv.total_amount)}`}
                                  >
                                    {isCheckIn && (
                                      <div className="font-medium truncate">
                                        {resv.guests?.first_name} {resv.guests?.last_name?.[0]}.
                                      </div>
                                    )}
                                  </div>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* List view */}
      {view === 'list' && (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-secondary/30">
                <tr>
                  <th className="text-left p-4 text-xs font-medium text-muted-foreground">รหัส</th>
                  <th className="text-left p-4 text-xs font-medium text-muted-foreground">แขก</th>
                  <th className="text-left p-4 text-xs font-medium text-muted-foreground">เช็คอิน</th>
                  <th className="text-left p-4 text-xs font-medium text-muted-foreground">เช็คเอาท์</th>
                  <th className="text-left p-4 text-xs font-medium text-muted-foreground">แหล่งที่มา</th>
                  <th className="text-left p-4 text-xs font-medium text-muted-foreground">ยอดเงิน</th>
                  <th className="text-left p-4 text-xs font-medium text-muted-foreground">สถานะ</th>
                </tr>
              </thead>
              <tbody>
                {reservations.length === 0 ? (
                  <tr><td colSpan={7}><EmptyState icon={Calendar} title="ยังไม่มีการจอง" description="คลิก 'จองใหม่' เพื่อสร้าง" /></td></tr>
                ) : reservations.map(r => (
                  <tr key={r.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                    <td className="p-4 font-mono text-xs">{r.reservation_code}</td>
                    <td className="p-4">
                      <div className="font-medium">{r.guests?.first_name} {r.guests?.last_name || ''}</div>
                    </td>
                    <td className="p-4 text-muted-foreground">{format(new Date(r.check_in), 'd MMM yyyy', { locale: th })}</td>
                    <td className="p-4 text-muted-foreground">{format(new Date(r.check_out), 'd MMM yyyy', { locale: th })}</td>
                    <td className="p-4">
                      <span className="text-2xs px-2 py-0.5 bg-secondary rounded">{r.source}</span>
                    </td>
                    <td className="p-4 font-medium ticker">{formatCurrency(r.total_amount)}</td>
                    <td className="p-4">
                      <Badge variant={
                        r.status === 'confirmed' ? 'info' :
                        r.status === 'checked_in' ? 'success' :
                        r.status === 'pending' ? 'warning' :
                        'secondary'
                      }>{r.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <CreateReservationModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        hotelId={hotelId}
        roomTypes={roomTypes}
        onSuccess={() => { setShowCreateModal(false); load(); }}
      />
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className={`h-2 w-2 rounded-sm ${color}`} />
      <span>{label}</span>
    </div>
  );
}

function CreateReservationModal({
  open, onClose, hotelId, roomTypes, onSuccess,
}: {
  open: boolean; onClose: () => void; hotelId: string;
  roomTypes: RoomType[]; onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    try {
      const response = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hotelId,
          firstName: fd.get('firstName'),
          lastName: fd.get('lastName'),
          email: fd.get('email'),
          phone: fd.get('phone'),
          nationality: fd.get('nationality'),
          checkIn: fd.get('checkIn'),
          checkOut: fd.get('checkOut'),
          roomTypeId: fd.get('roomTypeId'),
          numAdults: Number(fd.get('numAdults')),
          totalAmount: Number(fd.get('totalAmount')),
          source: fd.get('source') || 'direct',
          specialRequests: fd.get('specialRequests'),
        }),
      });
      if (!response.ok) throw new Error();
      toast.success('สร้างการจองสำเร็จ');
      onSuccess();
    } catch {
      toast.error('ไม่สามารถสร้างการจองได้');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>การจองใหม่</DialogTitle>
          <DialogDescription>กรอกข้อมูลการจอง ระบบจะสร้างใบกำกับและ folio อัตโนมัติ</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input name="firstName" label="ชื่อ" required />
            <Input name="lastName" label="นามสกุล" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input name="email" type="email" label="อีเมล" />
            <Input name="phone" label="เบอร์โทร" />
          </div>
          <Input name="nationality" label="สัญชาติ (ทร.30 สำหรับชาวต่างชาติ)" placeholder="เช่น Thai, Japanese" />
          <div className="grid grid-cols-2 gap-3">
            <Input name="checkIn" type="date" label="เช็คอิน" required />
            <Input name="checkOut" type="date" label="เช็คเอาท์" required />
          </div>
          <Select name="roomTypeId" label="ประเภทห้อง" required>
            {roomTypes.map(rt => (
              <option key={rt.id} value={rt.id}>{rt.name} — {formatCurrency(rt.base_rate)}/คืน</option>
            ))}
          </Select>
          <div className="grid grid-cols-2 gap-3">
            <Input name="numAdults" type="number" defaultValue={1} label="ผู้ใหญ่" required />
            <Input name="totalAmount" type="number" label="ยอดรวม (บาท)" required />
          </div>
          <Select name="source" label="แหล่งที่มา" defaultValue="direct">
            <option value="direct">Direct</option>
            <option value="walk_in">Walk-in</option>
            <option value="phone">โทรจอง</option>
            <option value="line">LINE</option>
            <option value="booking_com">Booking.com</option>
            <option value="agoda">Agoda</option>
            <option value="airbnb">Airbnb</option>
          </Select>
          <Input name="specialRequests" label="คำขอพิเศษ" />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>ยกเลิก</Button>
            <Button type="submit" disabled={loading}>{loading ? 'กำลังสร้าง...' : 'สร้างการจอง'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
