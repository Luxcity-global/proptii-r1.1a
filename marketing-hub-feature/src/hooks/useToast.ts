import { toast as sonnerToast } from 'sonner';

export interface ToastOptions {
  title?: string;
  description?: string;
  duration?: number;
  variant?: 'default' | 'destructive' | 'success' | 'warning';
}

export const useToast = () => {
  const toast = (options: ToastOptions) => {
    const { title, description, duration = 5000, variant = 'default' } = options;

    switch (variant) {
      case 'success':
        return sonnerToast.success(title, {
          description,
          duration,
        });
      case 'destructive':
        return sonnerToast.error(title, {
          description,
          duration,
        });
      case 'warning':
        return sonnerToast.warning(title, {
          description,
          duration,
        });
      default:
        return sonnerToast(title, {
          description,
          duration,
        });
    }
  };

  return { toast };
};

export interface ToastOptions {
  title?: string;
  description?: string;
  duration?: number;
  variant?: 'default' | 'destructive' | 'success' | 'warning';
}



