export type AppDialogTone = 'danger' | 'warning' | 'success' | 'info';

export interface AppAlertOptions {
  title?: string;
  message: string;
  buttonLabel?: string;
  tone?: AppDialogTone;
}

export interface AppConfirmOptions {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: AppDialogTone;
}

export interface ActiveAppDialog {
  id: number;
  kind: 'alert' | 'confirm';
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  tone: AppDialogTone;
}

interface QueuedDialog extends ActiveAppDialog {
  resolve: (value: boolean) => void;
}

type Listener = (dialog: ActiveAppDialog | null) => void;

const listeners = new Set<Listener>();
const queue: QueuedDialog[] = [];
let nextId = 1;

function notify() {
  const current = queue[0] ?? null;
  const payload: ActiveAppDialog | null = current
    ? {
        id: current.id,
        kind: current.kind,
        title: current.title,
        message: current.message,
        confirmLabel: current.confirmLabel,
        cancelLabel: current.cancelLabel,
        tone: current.tone,
      }
    : null;
  listeners.forEach((listener) => listener(payload));
}

function inferAlertMeta(message: string): { tone: AppDialogTone; title: string } {
  const m = message.trim();
  if (/\b(successfully|copied|signed\.?$)\b/i.test(m)) {
    return { tone: 'success', title: 'Done' };
  }
  if (/^(please|select|enter|you must|no\s+\w+\s+selected|no\s+(phone|email))/i.test(m)) {
    return { tone: 'warning', title: 'Attention Required' };
  }
  if (/\b(failed|error|unable|cannot|could not|corrupted|timed out|too large|not available|not found|invalid|demo contract)\b/i.test(m)) {
    return { tone: 'danger', title: 'Notice' };
  }
  return { tone: 'info', title: 'Notice' };
}

function inferConfirmMeta(message: string): {
  tone: AppDialogTone;
  title: string;
  confirmLabel: string;
} {
  const m = message.trim();
  if (/\brevoke\b/i.test(m)) {
    return { tone: 'danger', title: 'Revoke Access', confirmLabel: 'Revoke Access' };
  }
  if (/\bremove\b/i.test(m)) {
    return { tone: 'danger', title: 'Confirm Removal', confirmLabel: 'Remove' };
  }
  if (/\bdelete\b/i.test(m)) {
    if (/\bcontract\b/i.test(m)) {
      return { tone: 'danger', title: 'Delete Contract', confirmLabel: 'Delete' };
    }
    return { tone: 'danger', title: 'Confirm Deletion', confirmLabel: 'Delete' };
  }
  if (/\bunsaved changes\b/i.test(m)) {
    return { tone: 'warning', title: 'Discard Unsaved Changes?', confirmLabel: 'Discard & Close' };
  }
  if (/\breplace your current progress\b/i.test(m)) {
    return { tone: 'warning', title: 'Load Saved Draft?', confirmLabel: 'Load Draft' };
  }
  return { tone: 'warning', title: 'Please Confirm', confirmLabel: 'Confirm' };
}

export function subscribeAppDialog(listener: Listener): () => void {
  listeners.add(listener);
  listener(queue[0] ?? null);
  return () => {
    listeners.delete(listener);
  };
}

export function resolveActiveAppDialog(id: number, result: boolean): void {
  const index = queue.findIndex((item) => item.id === id);
  if (index === -1) return;
  const [entry] = queue.splice(index, 1);
  notify();
  entry.resolve(result);
}

/** Displays a branded Proptii modal notice instead of native browser alert(). */
export function showAlert(optionsOrMessage: string | AppAlertOptions): Promise<void> {
  const opts =
    typeof optionsOrMessage === 'string' ? { message: optionsOrMessage } : optionsOrMessage;
  if (listeners.size === 0) {
    return Promise.resolve();
  }
  const inferred = inferAlertMeta(opts.message);
  return new Promise<void>((resolve) => {
    queue.push({
      id: nextId++,
      kind: 'alert',
      title: opts.title ?? inferred.title,
      message: opts.message,
      confirmLabel: opts.buttonLabel ?? 'OK',
      tone: opts.tone ?? inferred.tone,
      resolve: () => resolve(),
    });
    if (queue.length === 1) notify();
  });
}

/** Displays a branded Proptii confirmation modal instead of native browser confirm(). */
export function showConfirm(optionsOrMessage: string | AppConfirmOptions): Promise<boolean> {
  const opts =
    typeof optionsOrMessage === 'string' ? { message: optionsOrMessage } : optionsOrMessage;
  if (listeners.size === 0) {
    return Promise.resolve(false);
  }
  const inferred = inferConfirmMeta(opts.message);
  return new Promise<boolean>((resolve) => {
    queue.push({
      id: nextId++,
      kind: 'confirm',
      title: opts.title ?? inferred.title,
      message: opts.message,
      confirmLabel: opts.confirmLabel ?? inferred.confirmLabel,
      cancelLabel: opts.cancelLabel ?? 'Cancel',
      tone: opts.tone ?? inferred.tone,
      resolve,
    });
    if (queue.length === 1) notify();
  });
}
