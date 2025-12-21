import React, { useState, useMemo } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { CalendarDate } from '../App';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, X, MousePointer2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';

interface ShortletCalendarProps {
  calendarDates: CalendarDate[];
  onDatesChange: (dates: CalendarDate[]) => void;
  basePrice?: number;
}

export function ShortletCalendar({ calendarDates = [], onDatesChange, basePrice }: ShortletCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showDateDialog, setShowDateDialog] = useState(false);
  const [dateStatus, setDateStatus] = useState<'available' | 'booked' | 'blocked' | 'maintenance'>('available');
  const [datePrice, setDatePrice] = useState<string>('');
  const [dateNotes, setDateNotes] = useState('');
  
  // Date range selection
  const [rangeStart, setRangeStart] = useState<Date | null>(null);
  const [rangeEnd, setRangeEnd] = useState<Date | null>(null);
  const [isSelectingRange, setIsSelectingRange] = useState(false);
  const [showRangeDialog, setShowRangeDialog] = useState(false);
  const [rangeStatus, setRangeStatus] = useState<'available' | 'booked' | 'blocked' | 'maintenance'>('available');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Get first day of month and number of days
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Create calendar grid
  const calendarDays = useMemo(() => {
    const days: (Date | null)[] = [];
    
    // Add empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  }, [year, month, firstDay, daysInMonth]);

  const getDateStatus = (date: Date): CalendarDate | null => {
    const dateStr = date.toISOString().split('T')[0];
    return calendarDates.find(d => d.date === dateStr) || null;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'booked':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'blocked':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'maintenance':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleDateClick = (date: Date, event: React.MouseEvent) => {
    const isPast = date < new Date() && date.toDateString() !== new Date().toDateString();
    if (isPast) return;

    // If in range selection mode
    if (isSelectingRange) {
      if (!rangeStart) {
        setRangeStart(date);
        setRangeEnd(null);
      } else {
        setRangeEnd(date);
        setIsSelectingRange(false);
        setShowRangeDialog(true);
      }
      return;
    }

    // Normal single date click
    const dateStr = date.toISOString().split('T')[0];
    const existingDate = getDateStatus(date);
    
    setSelectedDate(dateStr);
    setDateStatus(existingDate?.status || 'available');
    setDatePrice(existingDate?.price?.toString() || '');
    setDateNotes(existingDate?.notes || '');
    setShowDateDialog(true);
    setRangeStart(null);
    setRangeEnd(null);
  };

  const handleDateMouseEnter = (date: Date) => {
    if (isSelectingRange && rangeStart) {
      setRangeEnd(date);
    }
  };

  const isDateInRange = (date: Date): boolean => {
    if (!rangeStart || !rangeEnd) return false;
    const dateStr = date.toISOString().split('T')[0];
    const startStr = rangeStart.toISOString().split('T')[0];
    const endStr = rangeEnd.toISOString().split('T')[0];
    return dateStr >= startStr && dateStr <= endStr;
  };

  const handleSaveRange = () => {
    if (!rangeStart || !rangeEnd) return;

    const updatedDates = [...calendarDates];
    let start = new Date(rangeStart);
    let end = new Date(rangeEnd);
    
    // Ensure start is before end
    if (start > end) {
      const temp = start;
      start = end;
      end = temp;
    }

    const currentDate = new Date(start);
    while (currentDate <= end) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const existingIndex = updatedDates.findIndex(d => d.date === dateStr);
      
      if (existingIndex >= 0) {
        updatedDates[existingIndex] = { ...updatedDates[existingIndex], status: rangeStatus };
      } else {
        updatedDates.push({ date: dateStr, status: rangeStatus });
      }
      
      currentDate.setDate(currentDate.getDate() + 1);
    }

    onDatesChange(updatedDates);
    setShowRangeDialog(false);
    setRangeStart(null);
    setRangeEnd(null);
    setIsSelectingRange(false);
  };

  const handleCancelRange = () => {
    setRangeStart(null);
    setRangeEnd(null);
    setIsSelectingRange(false);
    setShowRangeDialog(false);
  };

  const handleSaveDate = () => {
    if (!selectedDate) return;

    const existingIndex = calendarDates.findIndex(d => d.date === selectedDate);
    const newDate: CalendarDate = {
      date: selectedDate,
      status: dateStatus,
      price: datePrice ? parseFloat(datePrice) : undefined,
      notes: dateNotes || undefined
    };

    let updatedDates: CalendarDate[];
    if (existingIndex >= 0) {
      updatedDates = [...calendarDates];
      updatedDates[existingIndex] = newDate;
    } else {
      updatedDates = [...calendarDates, newDate];
    }

    onDatesChange(updatedDates);
    setShowDateDialog(false);
    setSelectedDate(null);
    setDatePrice('');
    setDateNotes('');
  };

  const handleDeleteDate = () => {
    if (!selectedDate) return;

    const updatedDates = calendarDates.filter(d => d.date !== selectedDate);
    onDatesChange(updatedDates);
    setShowDateDialog(false);
    setSelectedDate(null);
  };

  const handleBulkAction = (status: 'available' | 'booked' | 'blocked' | 'maintenance', startDate: Date, endDate: Date) => {
    const updatedDates = [...calendarDates];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const existingIndex = updatedDates.findIndex(d => d.date === dateStr);
      
      if (existingIndex >= 0) {
        updatedDates[existingIndex] = { ...updatedDates[existingIndex], status };
      } else {
        updatedDates.push({ date: dateStr, status });
      }
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    onDatesChange(updatedDates);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5" />
            Availability Calendar
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant={isSelectingRange ? "default" : "outline"}
              size="sm"
              onClick={() => {
                if (isSelectingRange) {
                  handleCancelRange();
                } else {
                  setIsSelectingRange(true);
                  setRangeStart(null);
                  setRangeEnd(null);
                }
              }}
              title={isSelectingRange ? "Cancel range selection" : "Select date range"}
            >
              <MousePointer2 className="w-4 h-4 mr-1" />
              {isSelectingRange ? 'Cancel Range' : 'Select Range'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth('prev')}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="font-semibold min-w-[140px] text-center">
              {monthNames[month]} {year}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth('next')}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Legend */}
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2 text-sm">
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 rounded bg-green-100 border border-green-200"></div>
                <span>Available</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 rounded bg-red-100 border border-red-200"></div>
                <span>Booked</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 rounded bg-gray-100 border border-gray-200"></div>
                <span>Blocked</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 rounded bg-orange-100 border border-orange-200"></div>
                <span>Maintenance</span>
              </div>
            </div>
            <div className="text-xs text-muted-foreground">
              💡 Tip: Click a date to edit, or click "Select Range" and click two dates to select a range
            </div>
            {isSelectingRange && (
              <div className="p-2 bg-blue-50 border border-blue-200 rounded-lg text-sm">
                <span className="font-medium text-blue-800">Range selection mode:</span>
                <span className="text-blue-700 ml-2">
                  {rangeStart 
                    ? `Start: ${rangeStart.toLocaleDateString('en-GB')} - Click end date`
                    : 'Click start date'}
                </span>
              </div>
            )}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Day headers */}
            {dayNames.map(day => (
              <div key={day} className="text-center text-sm font-semibold text-gray-600 p-2">
                {day}
              </div>
            ))}
            
            {/* Calendar days */}
            {calendarDays.map((date, index) => {
              if (!date) {
                return <div key={`empty-${index}`} className="aspect-square"></div>;
              }

              const dateStatus = getDateStatus(date);
              const status = dateStatus?.status || 'available';
              const isToday = date.toDateString() === new Date().toDateString();
              const isPast = date < new Date() && !isToday;

              const inRange = isDateInRange(date);
              const isRangeStart = rangeStart && date.toISOString().split('T')[0] === rangeStart.toISOString().split('T')[0];
              const isRangeEnd = rangeEnd && date.toISOString().split('T')[0] === rangeEnd.toISOString().split('T')[0];

              return (
                <button
                  key={date.toISOString()}
                  onClick={(e) => handleDateClick(date, e)}
                  onMouseEnter={() => handleDateMouseEnter(date)}
                  disabled={isPast}
                  className={`
                    aspect-square rounded-lg border-2 p-1 text-sm transition-all relative
                    ${isPast ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-105'}
                    ${isToday ? 'ring-2 ring-blue-500' : ''}
                    ${inRange ? 'ring-2 ring-blue-400 bg-blue-50' : ''}
                    ${isRangeStart || isRangeEnd ? 'ring-2 ring-blue-600 bg-blue-100' : ''}
                    ${!inRange ? getStatusColor(status) : ''}
                  `}
                >
                  <div className="font-semibold">{date.getDate()}</div>
                  {dateStatus?.price && !inRange && (
                    <div className="text-xs mt-1">£{dateStatus.price}</div>
                  )}
                  {inRange && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {basePrice && (
            <p className="text-sm text-muted-foreground text-center">
              Base price: £{basePrice.toLocaleString()}/night
            </p>
          )}
        </div>
      </CardContent>

      {/* Date Details Dialog */}
      <Dialog open={showDateDialog} onOpenChange={setShowDateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedDate && new Date(selectedDate).toLocaleDateString('en-GB', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label>Status</Label>
              <Select value={dateStatus} onValueChange={(value: any) => setDateStatus(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="booked">Booked</SelectItem>
                  <SelectItem value="blocked">Blocked</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Override Price (optional)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2">£</span>
                <Input
                  type="number"
                  placeholder={basePrice?.toString() || '0'}
                  value={datePrice}
                  onChange={(e) => setDatePrice(e.target.value)}
                  className="pl-8"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Leave empty to use base price or pricing rules
              </p>
            </div>

            <div>
              <Label>Notes (optional)</Label>
              <Textarea
                placeholder="Add notes about this date..."
                value={dateNotes}
                onChange={(e) => setDateNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="destructive"
              onClick={handleDeleteDate}
            >
              <X className="w-4 h-4 mr-2" />
              Remove
            </Button>
            <Button onClick={handleSaveDate}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Range Selection Dialog */}
      <Dialog open={showRangeDialog} onOpenChange={setShowRangeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Update Date Range
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {rangeStart && rangeEnd && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium mb-1">Selected Range:</p>
                <p className="text-sm text-muted-foreground">
                  {rangeStart.toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })} - {rangeEnd.toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {Math.ceil((rangeEnd.getTime() - rangeStart.getTime()) / (1000 * 60 * 60 * 24)) + 1} days
                </p>
              </div>
            )}

            <div>
              <Label>Status for Selected Range</Label>
              <Select value={rangeStatus} onValueChange={(value: any) => setRangeStatus(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="booked">Booked</SelectItem>
                  <SelectItem value="blocked">Blocked</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={handleCancelRange}>
              Cancel
            </Button>
            <Button onClick={handleSaveRange}>
              Apply to Range
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

