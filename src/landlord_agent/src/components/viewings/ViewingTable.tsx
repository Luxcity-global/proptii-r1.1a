import React from 'react';
import {
  Calendar,
  Clock,
  CheckCircle,
  X,
  Send,
  MoreHorizontal,
  RotateCcw,
  Trash2,
  CheckSquare,
  Square,
  Eye,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import type { ViewingBooking } from '../../../../services/viewingService';
import { MobileAccordionCard } from '../../../../components/common/MobileAccordionCard';

export type RowActionTone = 'success' | 'accent' | 'danger' | 'neutral';

export interface RowAction {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  onSelect: () => void;
  disabled?: boolean;
  tone?: RowActionTone;
}

const ROW_ACTION_TONES: Record<RowActionTone, string> = {
  success: 'text-green-700 focus:bg-green-50 focus:text-green-700 [&_svg]:!text-green-600',
  accent: 'text-[#136C9E] focus:bg-[#136C9E]/10 focus:text-[#136C9E] [&_svg]:!text-[#136C9E]',
  danger: 'text-red-600 focus:bg-red-50 focus:text-red-700 [&_svg]:!text-red-600',
  neutral: 'text-gray-700 focus:bg-gray-100 focus:text-gray-900',
};

export function RowActionsMenu({ actions }: { actions: RowAction[] }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition"
          title="Actions"
          aria-label="Actions"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[170px] bg-white">
        {actions.map(({ label, icon: Icon, onSelect, disabled, tone }) => (
          <DropdownMenuItem
            key={label}
            disabled={disabled}
            onSelect={onSelect}
            className={`cursor-pointer ${ROW_ACTION_TONES[tone ?? 'neutral']}`}
          >
            <Icon className="mr-2 h-4 w-4" />
            {label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface ViewingTableProps {
  viewings: ViewingBooking[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onOpenDetail: (viewing: ViewingBooking) => void;
  onConfirm?: (viewing: ViewingBooking) => void;
  onReschedule?: (viewing: ViewingBooking) => void;
  onCancel?: (viewing: ViewingBooking) => void;
  onComplete?: (viewing: ViewingBooking) => void;
  onDelete?: (id: string) => void;
  formatDate: (date: string) => string;
  formatTime: (time: string) => string;
}

export const ViewingTable: React.FC<ViewingTableProps> = ({
  viewings,
  selectedIds,
  onToggleSelect,
  onOpenDetail,
  onConfirm,
  onReschedule,
  onCancel,
  onComplete,
  onDelete,
  formatDate,
  formatTime,
}) => {
  return (
    <>
      <div className="hidden md:block bg-white rounded-xl border border-gray-200 overflow-hidden shadow-xs">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="grid grid-cols-12 gap-4 text-sm font-semibold text-gray-700">
            <div className="col-span-1">Select</div>
            <div className="col-span-3">Property</div>
            <div className="col-span-2">Date & Time</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2">Tenant</div>
            <div className="col-span-2 text-center whitespace-nowrap">Actions</div>
          </div>
        </div>

        <div className="divide-y divide-gray-100">
          {viewings.map((viewing) => {
            const isSelected = selectedIds.has(viewing.id);
            const actions: RowAction[] = [
              {
                label: 'View details',
                icon: Eye,
                onSelect: () => onOpenDetail(viewing),
                tone: 'accent',
              },
            ];

            if (viewing.status === 'pending' && onConfirm) {
              actions.push({
                label: 'Confirm viewing',
                icon: CheckCircle,
                onSelect: () => onConfirm(viewing),
                tone: 'success',
              });
            }

            if (onReschedule) {
              actions.push({
                label: 'Propose new time',
                icon: RotateCcw,
                onSelect: () => onReschedule(viewing),
                tone: 'accent',
              });
            }

            if (viewing.status !== 'completed' && viewing.status !== 'cancelled' && onComplete) {
              actions.push({
                label: 'Mark as completed',
                icon: CheckCircle,
                onSelect: () => onComplete(viewing),
                tone: 'success',
              });
            }

            if (viewing.status !== 'cancelled' && onCancel) {
              actions.push({
                label: 'Cancel viewing',
                icon: X,
                onSelect: () => onCancel(viewing),
                tone: 'danger',
              });
            }

            if (onDelete) {
              actions.push({
                label: 'Delete record',
                icon: Trash2,
                onSelect: () => onDelete(viewing.id),
                tone: 'danger',
              });
            }

            return (
              <div
                key={viewing.id}
                className={`px-6 py-4 hover:bg-gray-50 transition-colors ${
                  isSelected ? 'bg-orange-50/40' : ''
                }`}
              >
                <div className="grid grid-cols-12 gap-4 items-center">
                  <div className="col-span-1">
                    <button
                      type="button"
                      onClick={() => onToggleSelect(viewing.id)}
                      className="flex items-center justify-center cursor-pointer"
                      title={isSelected ? 'Deselect' : 'Select'}
                    >
                      {isSelected ? (
                        <CheckSquare className="w-5 h-5 text-orange-500" />
                      ) : (
                        <Square className="w-5 h-5 text-gray-400" />
                      )}
                    </button>
                  </div>

                  <div className="col-span-3 min-w-0">
                    <button
                      type="button"
                      className="text-left font-semibold text-gray-900 truncate block hover:text-[#136C9E] text-sm"
                      onClick={() => onOpenDetail(viewing)}
                    >
                      {viewing.property.street}
                    </button>
                    <p className="text-xs text-gray-500 truncate">
                      {viewing.property.town}, {viewing.property.city}
                    </p>
                  </div>

                  <div className="col-span-2 text-xs text-gray-700">
                    <div className="flex items-center gap-1 font-medium">
                      <Calendar className="w-3.5 h-3.5 text-gray-400" />
                      <span>{formatDate(viewing.viewingDetails?.date || '')}</span>
                    </div>
                    <div className="flex items-center gap-1 text-gray-500 mt-0.5">
                      <Clock className="w-3.5 h-3.5 text-gray-400" />
                      <span>{formatTime(viewing.viewingDetails?.time || '')}</span>
                    </div>
                  </div>

                  <div className="col-span-2">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${
                        viewing.status === 'confirmed'
                          ? 'bg-green-100 text-green-800'
                          : viewing.status === 'pending'
                          ? 'bg-orange-100 text-orange-800'
                          : viewing.status === 'rescheduled'
                          ? 'bg-purple-100 text-purple-800'
                          : viewing.status === 'completed'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {viewing.status}
                    </span>
                  </div>

                  <div className="col-span-2 min-w-0 text-sm">
                    <p className="font-medium text-gray-900 truncate">
                      {viewing.viewingDetails?.userDetails?.fullName || 'Not provided'}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {viewing.viewingDetails?.userDetails?.email || ''}
                    </p>
                  </div>

                  <div className="col-span-2 flex items-center justify-center">
                    <RowActionsMenu actions={actions} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="md:hidden mob-accordion-container space-y-3">
        {viewings.map((viewing) => {
          const isSelected = selectedIds.has(viewing.id);
          const applicantName = viewing.viewingDetails?.userDetails?.fullName || 'Applicant';
          const initials = (applicantName || viewing.property.street || 'VW')
            .split(/\s+/)
            .filter(Boolean)
            .map((p) => p[0])
            .join('')
            .slice(0, 2)
            .toUpperCase() || 'VW';

          const statusVariant =
            viewing.status === 'confirmed' || viewing.status === 'completed'
              ? 'success'
              : viewing.status === 'pending'
                ? 'warning'
                : viewing.status === 'cancelled'
                  ? 'danger'
                  : 'neutral';

          return (
            <MobileAccordionCard
              key={viewing.id}
              initials={initials}
              title={viewing.property.street}
              subtitle={`${viewing.property.town}, ${viewing.property.city}`}
              statusBadge={{
                label: viewing.status,
                variant: statusVariant,
              }}
              metrics={[
                { label: 'Date', value: formatDate(viewing.viewingDetails?.date || '') },
                { label: 'Time', value: formatTime(viewing.viewingDetails?.time || '') },
                { label: 'Applicant', value: viewing.viewingDetails?.userDetails?.fullName || 'Not provided' },
              ]}
              actions={
                <div className="flex items-center gap-2 w-full pt-1">
                  <button
                    type="button"
                    className="flex-1 py-2 px-3 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center gap-1.5"
                    onClick={() => onOpenDetail(viewing)}
                  >
                    <Eye size={14} />
                    Details
                  </button>
                  {viewing.status === 'pending' && onConfirm && (
                    <button
                      type="button"
                      className="flex-1 py-2 px-3 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center gap-1"
                      onClick={() => onConfirm(viewing)}
                    >
                      <CheckCircle size={14} />
                      Confirm
                    </button>
                  )}
                  {onReschedule && (
                    <button
                      type="button"
                      className="py-2 px-3 text-xs font-semibold rounded-lg bg-blue-50 text-[#136C9E] flex items-center justify-center gap-1"
                      onClick={() => onReschedule(viewing)}
                    >
                      <RotateCcw size={14} />
                      Reschedule
                    </button>
                  )}
                  {onDelete && (
                    <button
                      type="button"
                      className="p-2 text-xs font-semibold rounded-lg bg-red-50 text-red-600 flex items-center justify-center"
                      onClick={() => onDelete(viewing.id)}
                      title="Delete viewing"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              }
            >
              <div className="space-y-2 text-xs text-slate-600 pt-1">
                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-400">Select for Bulk</span>
                  <button
                    type="button"
                    onClick={() => onToggleSelect(viewing.id)}
                    className="flex items-center gap-1.5 text-xs text-slate-700 font-medium"
                  >
                    {isSelected ? (
                      <>
                        <CheckSquare className="w-4 h-4 text-orange-500" />
                        <span>Selected</span>
                      </>
                    ) : (
                      <>
                        <Square className="w-4 h-4 text-slate-400" />
                        <span>Select</span>
                      </>
                    )}
                  </button>
                </div>
                {viewing.viewingDetails?.userDetails?.email && (
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-400">Email</span>
                    <span className="font-medium text-slate-700 truncate max-w-[200px]">
                      {viewing.viewingDetails.userDetails.email}
                    </span>
                  </div>
                )}
                {viewing.viewingDetails?.userDetails?.phone && (
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">Phone</span>
                    <span className="font-medium text-slate-700">
                      {viewing.viewingDetails.userDetails.phone}
                    </span>
                  </div>
                )}
              </div>
            </MobileAccordionCard>
          );
        })}
      </div>
    </>
  );
};

export default ViewingTable;
