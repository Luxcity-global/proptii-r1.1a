import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from './ui/dialog';

interface ExistingTenancyWarningProps {
  open: boolean;
  tenantName: string;
  currentAddress?: string;
  nextAddress?: string;
  /** Edit saves a move. Add and assign keep both tenancies. */
  mode?: 'add' | 'move';
  onCancel: () => void;
  onConfirm: () => void;
}

export function ExistingTenancyWarning({
  open,
  tenantName,
  currentAddress,
  nextAddress,
  mode = 'add',
  onCancel,
  onConfirm,
}: ExistingTenancyWarningProps) {
  const current = currentAddress || 'another property';
  const next = nextAddress || 'this property';
  const adding = mode === 'add';

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => { if (!nextOpen) onCancel(); }}>
      <DialogContent className="rounded-[20px]">
        <DialogHeader>
          <DialogTitle style={{ fontFamily: 'Archivo,sans-serif' }}>
            This tenant already has a property
          </DialogTitle>
          <DialogDescription>
            {tenantName} is already attached to {current}.
            {adding
              ? ` Adding them to ${next} keeps both tenancies. The Clients list will show one row for each property, and the existing tenancy stays where it is.`
              : ` Saving will move that tenancy to ${next}, so the Clients list will only show the new property. Cancel and use Add Tenant if both properties should stay listed.`}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-[10px] border border-[#e2e8f0] text-[13px] font-semibold text-[#64748b] hover:bg-[#f1f5f9] transition-all"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 rounded-[10px] text-[13px] font-semibold text-white transition-all hover:opacity-90"
            style={{ background: '#DC5F12', fontFamily: 'Archivo,sans-serif' }}
          >
            {adding ? 'Add to this property' : 'Move tenancy'}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
