import React from 'react';
import { motion } from 'framer-motion';
import { Button } from './ui/button';
import { useTheme } from '../contexts/theme-context';
import { Sun, Moon, Monitor } from 'lucide-react';
import { cn } from './ui/utils';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  className,
  showLabel = false,
}) => {
  const { theme, setTheme, resolvedTheme } = useTheme();

  const cycleTheme = () => {
    if (theme === 'light') {
      setTheme('dark');
    } else if (theme === 'dark') {
      setTheme('system');
    } else {
      setTheme('light');
    }
  };

  const getIcon = () => {
    if (theme === 'system') {
      return <Monitor className="h-4 w-4" />;
    }
    return resolvedTheme === 'dark' ? (
      <Moon className="h-4 w-4" />
    ) : (
      <Sun className="h-4 w-4" />
    );
  };

  const getLabel = () => {
    if (theme === 'system') {
      return 'System';
    }
    return resolvedTheme === 'dark' ? 'Dark' : 'Light';
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={cycleTheme}
      className={cn('relative', className)}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light'} theme`}
    >
      <motion.div
        key={theme}
        initial={{ opacity: 0, rotate: -90 }}
        animate={{ opacity: 1, rotate: 0 }}
        exit={{ opacity: 0, rotate: 90 }}
        transition={{ duration: 0.2, type: 'spring', stiffness: 200 }}
      >
        {getIcon()}
      </motion.div>
      {showLabel && (
        <span className="ml-2 text-sm font-medium">
          {getLabel()}
        </span>
      )}
    </Button>
  );
};

// Theme Selector Dropdown
interface ThemeSelectorProps {
  className?: string;
}

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({ className }) => {
  const { theme, setTheme, resolvedTheme } = useTheme();

  const themes = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
  ] as const;

  return (
    <div className={cn('flex flex-col space-y-1', className)}>
      {themes.map(({ value, label, icon: Icon }) => (
        <Button
          key={value}
          variant={theme === value ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setTheme(value)}
          className="justify-start"
        >
          <Icon className="mr-2 h-4 w-4" />
          {label}
          {value === 'system' && (
            <span className="ml-auto text-xs text-muted-foreground">
              ({resolvedTheme})
            </span>
          )}
        </Button>
      ))}
    </div>
  );
};

