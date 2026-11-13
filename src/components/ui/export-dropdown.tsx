'use client'

import { useEffect, useRef, useState } from 'react'
import { Download, FileImage, Loader2, FileSpreadsheet } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { supabase } from '@/lib/supabase'
import { apiCache } from '@/lib/cache'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'react-hot-toast'

interface ExportDropdownProps {
  type: 'patients' | 'visits'
  filters?: {
    search?: string
    patientId?: number
    startDate?: string
    endDate?: string
  }
  className?: string
  buttonText?: string
  variant?: 'button' | 'icon'
  hasRecords?: boolean
}

export function ExportDropdown({
  type,
  filters = {},
  className = '',
  buttonText = 'Export',
  variant = 'button',
  hasRecords = true
}: ExportDropdownProps) {
  const [isExporting, setIsExporting] = useState(false)
  const { user } = useAuth()
  const userId = user?.id ?? null
  const exportControllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    setIsExporting(false)
    return () => {
      exportControllerRef.current?.abort()
      exportControllerRef.current = null
    }
  }, [userId])

  const handleExport = async (format: 'csv' | 'json' | 'pdf' | 'excel') => {
    exportControllerRef.current?.abort()
    const controller = new AbortController()
    exportControllerRef.current = controller
    const owner = apiCache.snapshot()
    const assertCurrent = () => {
      if (controller.signal.aborted || !apiCache.isCurrent(owner)) {
        throw new DOMException('Export is no longer current', 'AbortError')
      }
    }
    setIsExporting(true)

    try {
      assertCurrent()
      const { data: { session } } = await supabase.auth.getSession()
      assertCurrent()
      if (!session?.access_token || !userId || owner.userId !== userId || session.user.id !== userId) {
        toast.error('Authentication required')
        return
      }

      // Build query parameters
      const params = new URLSearchParams()
      params.append('format', format)

      if (filters.search) params.append('search', filters.search)
      if (filters.patientId) params.append('patient_id', filters.patientId.toString())
      if (filters.startDate) params.append('startDate', filters.startDate)
      if (filters.endDate) params.append('endDate', filters.endDate)

      assertCurrent()
      const response = await fetch(`/api/export/${type}?${params.toString()}`, {
        signal: controller.signal,
        cache: 'no-store',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      assertCurrent()
      if (!response.ok) {
        const errorData = await response.json()
        assertCurrent()
        throw new Error(errorData.error || 'Export failed')
      }

      if (format === 'csv' || format === 'excel' || format === 'pdf') {
        // Handle file download (CSV, Excel, PDF)
        const blob = await response.blob()
        assertCurrent()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url

        // Extract filename from Content-Disposition header
        const contentDisposition = response.headers.get('Content-Disposition')
        const defaultExt = format === 'excel' ? 'xlsx' : format === 'pdf' ? 'pdf' : 'csv'
        const filename = contentDisposition?.match(/filename="(.+)"/)?.[1] ||
          `${type}_export_${new Date().toISOString().split('T')[0]}.${defaultExt}`

        a.download = filename
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)

        const formatName = format === 'excel' ? 'Excel' : format === 'pdf' ? 'PDF' : 'CSV'
        toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} exported as ${formatName} successfully!`)
      } else {
        // Handle JSON download
        const data = await response.json()
        assertCurrent()
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${type}_export_${new Date().toISOString().split('T')[0]}.json`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)

        toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} exported successfully!`)
      }
    } catch (error) {
      if (!controller.signal.aborted && apiCache.isCurrent(owner) && !(error instanceof DOMException && error.name === 'AbortError')) {
        toast.error(error instanceof Error ? error.message : 'Export failed')
      }
    } finally {
      if (exportControllerRef.current === controller) {
        exportControllerRef.current = null
        setIsExporting(false)
      }
    }
  }


  if (variant === 'icon') {
    return (
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-busy={isExporting}
            disabled={isExporting || !hasRecords}
            className={`inline-flex items-center justify-center h-11 w-11 rounded-lg bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:text-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none ${className}`}
            aria-label={isExporting ? `Exporting ${type}…` : `Export ${type}`}
            title={!hasRecords ? `No ${type} to export` : `Export ${type}`}
          >
            {isExporting ? (
              <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
            ) : (
              <Download aria-hidden="true" className="h-4 w-4" />
            )}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 glass-panel border border-gray-200 shadow-lg rounded-lg p-1">
          <DropdownMenuLabel className="px-3 py-2 text-sm font-semibold text-gray-900">Export all records</DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-gray-200 my-1" />
          <DropdownMenuItem
            onClick={() => handleExport('excel')}
            disabled={isExporting || !hasRecords}
            className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 focus:bg-gray-50 cursor-pointer rounded-md mx-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FileSpreadsheet aria-hidden="true" className="mr-2 h-4 w-4" />
            Download as Excel
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => handleExport('pdf')}
            disabled={isExporting || !hasRecords}
            className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 focus:bg-gray-50 cursor-pointer rounded-md mx-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FileImage aria-hidden="true" className="mr-2 h-4 w-4" />
            Download as PDF
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-busy={isExporting}
          disabled={isExporting || !hasRecords}
          className={`inline-flex min-h-11 items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none ${className}`}
          title={!hasRecords ? `No ${type} to export` : undefined}
        >
          {isExporting ? (
            <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
          ) : (
            <Download aria-hidden="true" className="h-4 w-4" />
          )}
          {buttonText}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 glass-panel border border-gray-200 shadow-lg rounded-lg p-1">
        <DropdownMenuLabel className="px-3 py-2 text-sm font-semibold text-gray-900">Export all records</DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-gray-200 my-1" />
        <DropdownMenuItem
          onClick={() => handleExport('excel')}
          disabled={isExporting || !hasRecords}
          className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 focus:bg-gray-50 cursor-pointer rounded-md mx-1 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FileSpreadsheet aria-hidden="true" className="mr-2 h-4 w-4" />
          Download as Excel
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleExport('pdf')}
          disabled={isExporting || !hasRecords}
          className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 focus:bg-gray-50 cursor-pointer rounded-md mx-1 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FileImage aria-hidden="true" className="mr-2 h-4 w-4" />
          Download as PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
