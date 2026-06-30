import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import type { DashboardStats } from '@/lib/types'

export function useDashboard() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const res = await api.get('/reports/dashboard')
      return res.data as DashboardStats
    },
  })
}

interface ReportParams {
  date_from?: string
  date_to?: string
  client_type?: string
  service_id?: number
}

export function useGeneralReport(params: ReportParams = {}) {
  return useQuery({
    queryKey: ['general-report', params],
    queryFn: async () => {
      const res = await api.get('/reports/general', { params })
      return res.data
    },
  })
}

export function useClientReport(clientId: number | string) {
  return useQuery({
    queryKey: ['client-report', clientId],
    queryFn: async () => {
      const res = await api.get(`/reports/client/${clientId}`)
      return res.data
    },
    enabled: !!clientId,
  })
}

export async function exportExcel(table: string = 'all') {
  const res = await api.get('/reports/export/excel', {
    params: { table },
    responseType: 'blob',
  })
  const url = window.URL.createObjectURL(new Blob([res.data]))
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', `reporte_${table}_${new Date().toISOString().split('T')[0]}.xlsx`)
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}
