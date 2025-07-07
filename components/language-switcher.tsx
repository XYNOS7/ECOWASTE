
'use client'

import * as React from "react"
import { useRouter, usePathname } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const languages = [
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "bn", name: "বাংলা", flag: "🇧🇩" },
  { code: "hi", name: "हिंदी", flag: "🇮🇳" },
]

export function LanguageSwitcher() {
  const router = useRouter()
  const pathname = usePathname()
  const locale = useLocale()
  const t = useTranslations('settings')

  const handleLanguageChange = (newLocale: string) => {
    // Remove the current locale from the pathname
    const pathnameWithoutLocale = pathname.replace(`/${locale}`, '') || '/'
    
    // Navigate to the new locale
    router.push(`/${newLocale}${pathnameWithoutLocale}`)
  }

  const currentLanguage = languages.find(lang => lang.code === locale)

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{t('selectLanguage')}</label>
      <Select value={locale} onValueChange={handleLanguageChange}>
        <SelectTrigger className="w-full">
          <SelectValue>
            <div className="flex items-center gap-2">
              <span>{currentLanguage?.flag}</span>
              <span>{currentLanguage?.name}</span>
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {languages.map((language) => (
            <SelectItem key={language.code} value={language.code}>
              <div className="flex items-center gap-2">
                <span>{language.flag}</span>
                <span>{language.name}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
