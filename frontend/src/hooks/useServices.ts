import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import type { Service, ClientService } from '@/lib/types'

export function useServices() {
  return useQuery({
    queryKey: ['services'],
    queryFn: async () => {
      const res = await api.get('/services/')
      return res.data as Service[]
    },
  })
}

export function useCreateService() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: Partial<Service>) => {
      const res = await api.post('/services/', data)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] })
    },
  })
}

export function useUpdateService() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Service> }) => {
      const res = await api.put(`/services/${id}`, data)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] })
    },
  })
}

export function useClientServices(clientId: number | string) {
  return useQuery({
    queryKey: ['client-services', clientId],
    queryFn: async () => {
      const res = await api.get(`/services/client/${clientId}`)
      return res.data as ClientService[]
    },
    enabled: !!clientId,
  })
}

export function useAssignService() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: {
      client_id: number
      service_id: number
      custom_price?: number | null
      period?: string
    }) => {
      const res = await api.post('/services/assign', data)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-services'] })
    },
  })
}
