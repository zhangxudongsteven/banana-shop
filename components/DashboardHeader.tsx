'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { LogOut, User, ChevronDown } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslation } from '../i18n/context'
import { useAuth } from './AuthProvider'
import LanguageSwitcher from './LanguageSwitcher'
import ThemeSwitcher from './ThemeSwitcher'
import { useHistory } from '../contexts/HistoryContext'

const DashboardHeader: React.FC = () => {
  const { t } = useTranslation()
  const { user } = useAuth()
  const router = useRouter()
  const { toggleHistoryPanel } = useHistory()
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      })

      if (response.ok) {
        toast.success('已退出登录')
        router.push('/home')
      } else {
        throw new Error('退出登录失败')
      }
    } catch (error) {
      console.error('Logout error:', error)
      toast.error('退出登录失败，请重试')
    }
  }

  return (
    <header className="bg-[var(--bg-card-alpha)] backdrop-blur-lg sticky top-0 z-20 p-4 border-b border-[var(--border-primary)]">
      <div className="container mx-auto flex justify-between items-center">
        <Link
          href="/home"
          className="text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] cursor-pointer"
        >
          {t('app.title')}
        </Link>
        <div className="flex items-center gap-2 md:gap-4">
          <button
            onClick={toggleHistoryPanel}
            className="flex items-center gap-2 py-2 px-3 text-sm font-semibold text-[var(--text-primary)] bg-[rgba(107,114,128,0.2)] rounded-md hover:bg-[rgba(107,114,128,0.4)] transition-colors duration-200"
            aria-label="Toggle generation history"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                clipRule="evenodd"
              />
            </svg>
            <span className="hidden sm:inline">{t('app.history')}</span>
          </button>
          <div className="relative">
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-2 py-2 px-3 text-sm font-semibold text-[var(--text-primary)] bg-[rgba(107,114,128,0.2)] rounded-md hover:bg-[rgba(107,114,128,0.4)] transition-colors duration-200"
            >
              <User className="h-4 w-4" />
              <span className="max-w-[150px] truncate hidden sm:inline">{user?.username}</span>
              <ChevronDown
                className={`h-4 w-4 transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl shadow-xl z-50 overflow-hidden animate-fade-in-fast p-2 flex flex-col gap-1">
                <div className="sm:hidden px-3 py-2 text-sm font-semibold text-[var(--text-primary)] border-b border-[var(--border-primary)] mb-1">
                  {user?.username}
                </div>

                <div className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors">
                  <span className="text-sm">语言 / Language</span>
                  <LanguageSwitcher />
                </div>
                <div className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors">
                  <span className="text-sm">主题 / Theme</span>
                  <ThemeSwitcher />
                </div>

                <div className="h-px bg-[var(--border-primary)] my-1" />

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm font-semibold text-[var(--text-error)] hover:bg-[var(--bg-error)] rounded-lg transition-colors duration-200"
                >
                  <LogOut className="h-4 w-4" />
                  <span>退出登录</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

export default DashboardHeader
