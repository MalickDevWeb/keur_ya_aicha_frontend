import { Languages } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useI18n, Language } from '@/lib/i18n';
import { cn } from '@/lib/utils';

interface LanguageSelectorProps {
  variant?: 'default' | 'sidebar';
  className?: string;
}

export function LanguageSelector({ variant = 'default', className }: LanguageSelectorProps) {
  const { language, setLanguage } = useI18n();

  const languages: { code: Language; label: string; flag: string }[] = [
    { code: 'fr', label: 'Français', flag: '🇫🇷' },
    { code: 'en', label: 'English', flag: '🇬🇧' },
  ];

  const currentLang = languages.find((l) => l.code === language);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant === 'sidebar' ? 'ghost' : 'outline'}
          size="sm"
          className={cn(
            'gap-2',
            variant === 'sidebar' && 'text-sidebar-foreground hover:bg-sidebar-accent',
            variant !== 'sidebar' &&
              'text-[#121B53] border-white/60 bg-white/95 hover:bg-white/95 hover:text-[#121B53]',
            className
          )}
        >
          <Languages className="h-4 w-4" />
          <span className="hidden sm:inline">{currentLang?.flag}</span>
          <span className="uppercase">{language}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => setLanguage(lang.code)}
            className={cn(
              'gap-2 cursor-pointer',
              language === lang.code && 'bg-accent'
            )}
          >
            <span>{lang.flag}</span>
            <span>{lang.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
