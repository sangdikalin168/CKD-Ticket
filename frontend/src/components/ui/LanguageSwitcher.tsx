import React from 'react';
import { useTranslation } from 'react-i18next';
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import { Check, ChevronsUpDown, Languages } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuTrigger,
} from './DropdownMenuRadix';
import { SUPPORTED_LANGUAGES, type LanguageOption } from '../../i18n/i18n';
import { LANGUAGE_FLAGS } from './flags';

export interface LanguageSwitcherProps {
  languages?: readonly LanguageOption[];
  side?: 'top' | 'bottom' | 'left' | 'right';
  align?: 'start' | 'center' | 'end';
  className?: string;
}

/** Compact language dropdown. Persists the choice via i18next's localStorage cache. */
export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  languages = SUPPORTED_LANGUAGES,
  side = 'bottom',
  align = 'start',
  className = '',
}) => {
  const { t, i18n } = useTranslation();
  const current = i18n.resolvedLanguage ?? i18n.language;
  const active = languages.find((lang) => lang.code === current) ?? languages[0];
  if (!active) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={t('language.label')}
          className={`flex h-9 items-center gap-2 rounded-md px-2 text-sm text-ink outline-none transition-colors hover:bg-wash focus-visible:ring-2 focus-visible:ring-ring data-[state=open]:bg-wash ${className}`}
        >
          <LanguageFlag code={active.code} />
          <span className="hidden flex-1 truncate text-left sm:inline">{active.nativeName}</span>
          <ChevronsUpDown className="hidden h-3.5 w-3.5 shrink-0 text-ink-soft sm:inline" aria-hidden />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side={side}
        align={align}
        className="min-w-[var(--radix-dropdown-menu-trigger-width)]"
      >
        <DropdownMenuRadioGroup
          value={active.code}
          onValueChange={(code) => i18n.changeLanguage(code)}
        >
          {languages.map((lang) => (
            <LanguageMenuItem key={lang.code} language={lang} />
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const LanguageFlag: React.FC<{ code: string }> = ({ code }) => {
  const Flag = LANGUAGE_FLAGS[code];
  if (!Flag) return <Languages className="h-4 w-4 shrink-0 text-ink-soft" aria-hidden />;
  return <Flag className="h-3.5 w-5 shrink-0 overflow-hidden rounded-[2px] ring-1 ring-rule" />;
};

const LanguageMenuItem: React.FC<{ language: LanguageOption }> = ({ language }) => (
  <DropdownMenuPrimitive.RadioItem
    value={language.code}
    className="flex cursor-pointer select-none items-center gap-3 rounded-sm px-2 py-2 outline-none transition-colors focus:bg-wash focus:text-ink data-[state=checked]:font-medium"
  >
    <LanguageFlag code={language.code} />
    <span className="flex flex-1 flex-col text-left">
      <span className="text-sm leading-5">{language.nativeName}</span>
      {language.englishName !== language.nativeName && (
        <span className="text-xs font-normal leading-4 text-ink-soft">
          {language.englishName}
        </span>
      )}
    </span>
    <DropdownMenuPrimitive.ItemIndicator>
      <Check className="h-4 w-4 text-ink" aria-hidden />
    </DropdownMenuPrimitive.ItemIndicator>
  </DropdownMenuPrimitive.RadioItem>
);
