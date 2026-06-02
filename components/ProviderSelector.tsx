import React from 'react'
import { Check, Cpu, Sparkles } from 'lucide-react'
import type { ProviderProfileOption } from '../types'
import { useTranslation } from '../i18n/context'

interface ProviderSelectorProps {
  options: ProviderProfileOption[]
  selectedKey: string
  onSelect: (key: string) => void
}

const ProviderSelector: React.FC<ProviderSelectorProps> = ({ options, selectedKey, onSelect }) => {
  const { t } = useTranslation()

  if (options.length < 2) return null

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
        <Cpu className="h-4 w-4 text-[var(--accent-primary)]" />
        <span>{t('providerSelector.title')}</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {options.map((option) => {
          const isSelected = option.key === selectedKey

          return (
            <button
              key={option.key}
              type="button"
              onClick={() => onSelect(option.key)}
              aria-pressed={isSelected}
              className={`min-h-[74px] rounded-lg border p-3 text-left transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--bg-card)] focus:ring-[var(--accent-primary)] ${
                isSelected
                  ? 'border-[var(--accent-primary)] bg-[rgba(249,115,22,0.12)] shadow-[0_0_0_1px_var(--accent-shadow)]'
                  : 'border-[var(--border-primary)] bg-[var(--bg-secondary)] hover:border-[var(--accent-primary)]'
              }`}
            >
              <span className="flex items-start justify-between gap-3">
                <span className="min-w-0">
                  <span className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
                    <Sparkles className="h-4 w-4 shrink-0 text-[var(--accent-secondary)]" />
                    <span className="truncate">{t(option.titleKey)}</span>
                  </span>
                  {option.descriptionKey && (
                    <span className="mt-1 block text-xs leading-5 text-[var(--text-secondary)]">
                      {t(option.descriptionKey)}
                    </span>
                  )}
                </span>
                {isSelected && (
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--accent-primary)] text-[var(--text-on-accent)]">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                )}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default ProviderSelector
