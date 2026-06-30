import { useParams, useNavigate } from 'react-router-dom'
import { usePaymentProofs } from '@/hooks/usePayments'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, FileText, Image } from 'lucide-react'

export default function PaymentProofViewer() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: proofs, isLoading } = usePaymentProofs(id || '')

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">Comprobantes de Pago</h1>
      </div>

      {isLoading ? (
        <Card><CardContent className="p-6 text-center">Cargando...</CardContent></Card>
      ) : proofs?.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            No hay comprobantes para este pago
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {proofs?.map((proof) => (
            <Card key={proof.id}>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  {proof.file_type?.includes('pdf') ? (
                    <FileText className="h-4 w-4" />
                  ) : (
                    <Image className="h-4 w-4" />
                  )}
                  Comprobante #{proof.id}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Subido: {new Date(proof.uploaded_at).toLocaleDateString('es-MX')}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Tipo: {proof.file_type}
                  </p>
                  {proof.file_type?.includes('image') ? (
                    <div className="border rounded-md p-2">
                      <img
                        src={`/api/${proof.file_path}`}
                        alt="Comprobante"
                        className="w-full h-auto max-h-64 object-contain"
                      />
                    </div>
                  ) : (
                    <a
                      href={`/api/${proof.file_path}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="outline" className="w-full">
                        <FileText className="mr-2 h-4 w-4" />
                        Ver PDF
                      </Button>
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
