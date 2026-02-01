import { useState, useCallback } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchInput({ value, onChange, placeholder, className }: SearchInputProps) {
  const { t } = useI18n();
  const [isFocused, setIsFocused] = useState(false);

  const handleClear = useCallback(() => {
    onChange('');
  }, [onChange]);

  return (
    <div
      className={cn(
        'relative flex items-center transition-all duration-200',
        isFocused && 'ring-2 ring-ring ring-offset-2 rounded-md',
        className
      )}
    >
      <Search
        className={cn(
          'absolute left-3 w-4 h-4 transition-colors',
          isFocused ? 'text-primary' : 'text-muted-foreground'
        )}
      />
      <Input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder || t('clients.searchPlaceholder')}
        className="pl-9 pr-9 focus-visible:ring-0 focus-visible:ring-offset-0"
      />
      {value && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-1 h-7 w-7 hover:bg-muted"
          onClick={handleClear}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
