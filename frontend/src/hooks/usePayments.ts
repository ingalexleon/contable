import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import type { Payment, PaymentProof } from '@/lib/types'

interface PaymentsParams {
  client_id?: number
  status?: string
  date_from?: string
  date_to?: string
  skip?: number
  limit?: number
}

export function usePayments(params: PaymentsParams = {}) {
  return useQuery({
    queryKey: ['payments', params],
    queryFn: async () => {
      const res = await api.get('/payments/', { params })
      return res.data as Payment[]
    },
  })
}

export function useCreatePayment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: Partial<Payment>) => {
      const res = await api.post('/payments/', data)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] })
    },
  })
}

export function useUploadProof() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ paymentId, file }: { paymentId: number; file: File }) => {
      const formData = new FormData()
      formData.append('file', file)
      const res = await api.post(`/payments/${paymentId}/proof`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-proofs'] })
    },
  })
}

export function usePaymentProofs(paymentId: number | string) {
  return useQuery({
    queryKey: ['payment-proofs', paymentId],
    queryFn: async () => {
      const res = await api.get(`/payments/${paymentId}/proofs`)
      return res.data as PaymentProof[]
    },
    enabled: !!paymentId,
  })
}
