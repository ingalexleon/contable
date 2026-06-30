import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import type { Client } from '@/lib/types'

interface ClientsParams {
  search?: string
  client_type?: string
  include_inactive?: boolean
  skip?: number
  limit?: number
}

export function useClients(params: ClientsParams = {}) {
  return useQuery({
    queryKey: ['clients', params],
    queryFn: async () => {
      const res = await api.get('/clients/', { params })
      return res.data as Client[]
    },
  })
}

export function useClient(id: number | string) {
  return useQuery({
    queryKey: ['client', id],
    queryFn: async () => {
      const res = await api.get(`/clients/${id}`)
      return res.data as Client
    },
    enabled: !!id,
  })
}

export function useCreateClient() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: Partial<Client>) => {
      const res = await api.post('/clients/', data)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
    },
  })
}

export function useUpdateClient() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Client> }) => {
      const res = await api.put(`/clients/${id}`, data)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
    },
  })
}

export function useDeleteClient() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/clients/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
    },
  })
}
