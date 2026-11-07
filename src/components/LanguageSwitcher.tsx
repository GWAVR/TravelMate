import { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Language } from '../i18n/translations';

interface LanguageSwitcherProps {
  variant?: 'header' | 'profile' | 'compact';
  onLanguageChanged?: (lang: Language) => void;
}

export function LanguageSwitcher({ variant = 'header', onLanguageChanged }: LanguageSwitcherProps) {
  const { language, setLanguage, toggleLanguage, supportedLanguages, currentLanguageOption } =
    useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (lang: Language) => {
    setLanguage(lang);
    setIsOpen(false);
    if (onLanguageChanged) {
      onLanguageChanged(lang);
    }
  };

  if (variant === 'profile') {
    return (
      <div className="flex items-center gap-2 w-full">
        {supportedLanguages.map((option) => {
          const isActive = language === option.code;
          return (
            <button
              key={option.code}
              type="button"
              onClick={() => handleSelect(option.code)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-bold transition-all ${
                isActive
                  ? 'bg-[#006194] text-white border-[#006194] shadow-xs ring-2 ring-[#006194]/20'
                  : 'bg-white text-[#334155] border-[#e2e8f0] hover:bg-[#f8fafc] active:bg-[#f1f5f9]'
              }`}
            >
              <span className="text-base leading-none">{option.flag}</span>
              <span className="leading-none">{option.nativeName}</span>
              {isActive && (
                <span className="material-symbols-outlined text-[14px] text-white">check</span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  // Header and compact variant
  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Switch Language / भाषा बदलें"
        title={`Language: ${currentLanguageOption.nativeName} (Click to change)`}
        className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#e8eefc] hover:bg-[#d8e4fc] active:bg-[#c7daf9] text-[#006194] transition-all min-h-[32px] border border-[#006194]/20 shadow-2xs"
      >
        <span className="material-symbols-outlined text-[16px] text-[#006194]">translate</span>
        <span className="text-[11px] font-bold tracking-wide">
          {language === 'hi' ? 'हिन्दी' : 'EN'}
        </span>
        <span
          className={`material-symbols-outlined text-[14px] text-[#006194]/70 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        >
          arrow_drop_down
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1.5 w-44 bg-white rounded-2xl shadow-xl border border-[#e2e8f0] p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-2.5 py-1 text-[10px] font-bold text-[#64748b] uppercase tracking-wider">
            Select Language / भाषा चुनें
          </div>
          <div className="space-y-1">
            {supportedLanguages.map((option) => {
              const isSelected = language === option.code;
              return (
                <button
                  key={option.code}
                  type="button"
                  onClick={() => handleSelect(option.code)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs transition-colors ${
                    isSelected
                      ? 'bg-[#e0f2fe] text-[#006194] font-bold'
                      : 'hover:bg-[#f1f5f9] text-[#1e293b] font-medium'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">{option.flag}</span>
                    <div className="flex flex-col">
                      <span className="leading-tight">{option.nativeName}</span>
                      <span className="text-[10px] text-[#64748b] leading-tight">
                        {option.name}
                      </span>
                    </div>
                  </div>
                  {isSelected && (
                    <span className="material-symbols-outlined text-[16px] text-[#006194]">
                      check
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
