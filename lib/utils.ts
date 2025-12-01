import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateUniqueCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

export function formatDate(date: Date | string): string {
  // Si es string, parsearlo como fecha local (YYYY-MM-DD)
  let d: Date
  if (typeof date === 'string') {
    // Si viene en formato YYYY-MM-DD, crear fecha en zona horaria local
    const [year, month, day] = date.split('-').map(Number)
    d = new Date(year, month - 1, day)
  } else {
    d = date
  }
  return d.toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function formatTime(time: string): string {
  return time
}


