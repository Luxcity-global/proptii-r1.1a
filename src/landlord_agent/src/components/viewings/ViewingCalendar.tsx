import React from 'react';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import type { ViewingBooking } from '../../../../services/viewingService';

export const CALENDAR_HOURS = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18];
export const CALENDAR_EVENT_COLORS = ['#136C9E', '#7c3aed', '#DC5F12', '#059669', '#0369a1'];

export function startOfWeekMonday(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function sameDateKey(a: string | undefined, b: string): boolean {
  if (!a) return false;
  return a.slice(0, 10) === b;
}

export function parseViewingHour(time?: string): number | null {
  if (!time) return null;
  const trimmed = time.trim();
  const twentyFour = trimmed.match(/^(\d{1,2}):(\d{2})/);
  if (twentyFour) {
    const hour = Number(twentyFour[1]);
    if (Number.isFinite(hour)) return hour;
  }
  const twelve = trimmed.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/i);
  if (twelve) {
    let hour = Number(twelve[1]);
    const meridiem = twelve[3].toUpperCase();
    if (meridiem === 'PM' && hour < 12) hour += 12;
    if (meridiem === 'AM' && hour === 12) hour = 0;
    return hour;
  }
  return null;
}

export function formatHourLabel(hour: number): string {
  if (hour === 0) return '12 AM';
  if (hour < 12) return `${hour} AM`;
  if (hour === 12) return '12 PM';
  return `${hour - 12} PM`;
}

export function calendarEventColor(index: number): string {
  return CALENDAR_EVENT_COLORS[index % CALENDAR_EVENT_COLORS.length];
}

interface ViewingCalendarProps {
  calendarMonthLabel: string;
  calendarWeekStart: Date;
  setCalendarWeekStart: React.Dispatch<React.SetStateAction<Date>>;
  calendarDays: Date[];
  calendarWeekEvents: ViewingBooking[];
  onOpenEventDetail: (viewing: ViewingBooking) => void;
  onOpenRequestModal: (propertyId?: string, defaultValues?: { date?: string; time?: string }) => void;
  formatTime: (time: string) => string;
}

export const ViewingCalendar: React.FC<ViewingCalendarProps> = ({
  calendarMonthLabel,
  setCalendarWeekStart,
  calendarDays,
  calendarWeekEvents,
  onOpenEventDetail,
  onOpenRequestModal,
  formatTime,
}) => {
  return (
    <div className="ll-vw-calendar">
      <div className="ll-vw-calendar-head">
        <h2>{calendarMonthLabel}</h2>
        <div className="ll-vw-calendar-nav">
          <button
            type="button"
            aria-label="Previous week"
            onClick={() => setCalendarWeekStart((prev) => addDays(prev, -7))}
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            className="is-today"
            onClick={() => setCalendarWeekStart(startOfWeekMonday(new Date()))}
          >
            Today
          </button>
          <button
            type="button"
            aria-label="Next week"
            onClick={() => setCalendarWeekStart((prev) => addDays(prev, 7))}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="ll-vw-calendar-scroll">
        <div className="ll-vw-calendar-grid">
          <div className="ll-vw-calendar-weekdays">
            <div className="ll-vw-calendar-time-label">Time</div>
            {calendarDays.map((day) => {
              const key = toDateKey(day);
              const isToday = key === toDateKey(new Date());
              return (
                <div key={key} className="ll-vw-calendar-weekday">
                  <span>{day.toLocaleDateString(undefined, { weekday: 'short' })}</span>
                  <strong className={isToday ? 'is-today' : undefined}>
                    {day.getDate()}
                  </strong>
                </div>
              );
            })}
          </div>

          <div className="ll-vw-calendar-hours">
            {CALENDAR_HOURS.map((hour) => (
              <div key={hour} className="ll-vw-calendar-row">
                <div className="ll-vw-calendar-hour">{formatHourLabel(hour)}</div>
                {calendarDays.map((day) => {
                  const dayKey = toDateKey(day);
                  const slotEvents = calendarWeekEvents.filter((viewing) => {
                    const viewingHour = parseViewingHour(viewing.viewingDetails?.time);
                    return (
                      sameDateKey(viewing.viewingDetails?.date, dayKey) &&
                      viewingHour === hour
                    );
                  });
                  return (
                    <div
                      key={`${dayKey}-${hour}`}
                      className="ll-vw-calendar-cell"
                      role="button"
                      tabIndex={0}
                      onClick={() => {
                        if (slotEvents[0]) {
                          onOpenEventDetail(slotEvents[0]);
                          return;
                        }
                        onOpenRequestModal(undefined, {
                          date: dayKey,
                          time: `${String(hour).padStart(2, '0')}:00`,
                        });
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          if (slotEvents[0]) {
                            onOpenEventDetail(slotEvents[0]);
                            return;
                          }
                          onOpenRequestModal(undefined, {
                            date: dayKey,
                            time: `${String(hour).padStart(2, '0')}:00`,
                          });
                        }
                      }}
                    >
                      {slotEvents.map((viewing, index) => (
                        <button
                          key={viewing.id}
                          type="button"
                          className="ll-vw-calendar-event"
                          style={{ background: calendarEventColor(index + hour) }}
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenEventDetail(viewing);
                          }}
                        >
                          <strong>{viewing.property.street}</strong>
                          <em>
                            <Clock size={11} />
                            {formatTime(viewing.viewingDetails?.time || '')}
                          </em>
                        </button>
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {calendarWeekEvents.length === 0 && (
        <p className="ll-vw-calendar-empty">
          No viewings scheduled this week. Click an empty slot to request a viewing.
        </p>
      )}
    </div>
  );
};

export default ViewingCalendar;
