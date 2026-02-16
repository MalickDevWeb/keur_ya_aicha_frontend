import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Archive, Ban, Plus, Home, CreditCard, FileText, Wallet, DollarSign, Loader2, RotateCcw, Upload, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow, } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { BadgeStatut } from '@/components/BadgeStatut';
import { CardStat } from '@/components/CardStat';
import { useI18n } from '@/lib/i18n';
import { useStore } from '@/stores/dataStore';
import { QuickPaymentModal } from '@/components/QuickPaymentModal';
import { PaymentModal } from '@/components/PaymentModal';
import { useIsMobile } from '@/hooks/use-mobile';
import { useToast } from '@/hooks/use-toast';
import { useGoBack } from '@/hooks/useGoBack';
import { getCloudinaryOpenUrl } from '@/services/api/uploads.api';
import { formatCurrency,
  calculatePaymentStatus,
  calculateClientPaymentStatus, } from '@/lib/types';
import { useClientDetailActions } from './hooks/useClientDetailActions';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function ClientDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const goBack = useGoBack('/clients');
  const { t, language } = useI18n();
  const { toast } = useToast();
  const getClient = useStore((state) => state.getClient)
  const archiveClient = useStore((state) => state.archiveClient)
  const blacklistClient = useStore((state) => state.blacklistClient)
  const addDocument = useStore((state) => state.addDocument)
  const client = getClient(id || '');
  const actions = useClientDetailActions(client);
  const isMobile = useIsMobile();
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [selectedRentalId, setSelectedRentalId] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [docName, setDocName] = useState('')
  const [docType, setDocType] = useState<'contract' | 'receipt' | 'other'>('other')
  const [docSigned, setDocSigned] = useState(false)
  const [isUploadingDoc, setIsUploadingDoc] = useState(false)
  const [openingDocId, setOpeningDocId] = useState<string | null>(null)

  useEffect(() => {
    const firstRentalId = client?.rentals?.[0]?.id || ''
    if (!firstRentalId) {
      setSelectedRentalId('')
      return
    }
    setSelectedRentalId((previous) => {
      if (previous && client?.rentals?.some((rental) => rental.id === previous)) return previous
      return firstRentalId
    })
  }, [client?.id, client?.rentals])

  const clientDocuments = useMemo(
    () =>
      (client?.rentals || []).flatMap((rental) =>
        (rental.documents || []).map((doc) => ({
          ...doc,
          rentalId: rental.id,
          propertyName: rental.propertyName,
        }))
      ),
    [client]
  )

  const handleUploadDocument = async () => {
    if (!client) return
    if (!selectedRentalId) {
      toast({ title: 'Erreur', description: 'Sélectionnez une location', variant: 'destructive' })
      return
    }
    if (!selectedFile) {
      toast({ title: 'Erreur', description: 'Sélectionnez un fichier PDF', variant: 'destructive' })
      return
    }

    try {
      setIsUploadingDoc(true)
      const name = docName.trim() || selectedFile.name
      await addDocument(client.id, selectedRentalId, {
        name,
        type: docType,
        signed: docSigned,
        file: selectedFile,
      })
      setSelectedFile(null)
      setDocName('')
      setDocType('other')
      setDocSigned(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      toast({
        title: 'Téléversement réussi',
        description: 'Le document est stocké.',
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Téléversement impossible'
      toast({ title: 'Erreur', description: message, variant: 'destructive' })
    } finally {
      setIsUploadingDoc(false)
    }
  }

  const handleOpenDocument = async (doc: { id: string; url?: string }) => {
    const docUrl = String(doc?.url || '').trim()
    if (!docUrl) {
      toast({ title: 'Erreur', description: 'Document sans URL.', variant: 'destructive' })
      return
    }

    const popup = window.open('', '_blank', 'noopener,noreferrer')
    if (!popup) {
      toast({ title: 'Erreur', description: 'Autorisez les popups pour ouvrir le document.', variant: 'destructive' })
      return
    }

    try {
      popup.opener = null
    } catch {
      // ignore
    }

    try {
      setOpeningDocId(doc.id)
      popup.document.title = 'Chargement du document...'
      popup.document.body.innerHTML = "<p style='font-family:sans-serif;padding:16px'>Chargement du document...</p>"
      const openUrl = await getCloudinaryOpenUrl(docUrl)
      popup.location.href = openUrl
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Impossible d’ouvrir le document.'
      toast({ title: 'Erreur', description: message, variant: 'destructive' })
      try {
        popup.close()
      } catch {
        // ignore
      }
    } finally {
      setOpeningDocId((current) => (current === doc.id ? null : current))
    }
  }

  if (!client) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <p className="text-muted-foreground">Client non trouvé</p>
        <Button variant="outline" onClick={() => goBack('/clients')}>
          Retour à la liste
        </Button>
      </div>
    );
  }

  const globalStatus = calculateClientPaymentStatus(client);
  const dateLocale = language === 'fr' ? fr : undefined;

  const handleArchive = () => {
    archiveClient(client.id);
    navigate('/clients');
  };

  const handleBlacklist = () => {
    blacklistClient(client.id);
    navigate('/clients');
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header with Navigation and Title */}
      <div className="flex flex-col gap-4">
        <Button variant="ghost" size="sm" onClick={() => goBack('/clients')} className="w-fit">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour aux clients
        </Button>
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-foreground">{client.firstName} {client.lastName}</h1>
          <p className="text-base text-muted-foreground mt-1">{client.phone} • {client.cni}</p>
        </div>
      </div>

      {/* Main Info Grid */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Left Column - Contact Info */}
        <div className="lg:col-span-1 space-y-3">
          <Card className="border-l-4 border-l-blue-500 bg-gradient-to-br from-blue-50 to-cyan-50">
            <CardContent className="pt-6">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Téléphone</p>
              <p className="text-lg font-bold text-slate-900">{client.phone}</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-purple-500 bg-gradient-to-br from-purple-50 to-pink-50">
            <CardContent className="pt-6">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">CNI</p>
              <p className="text-lg font-bold text-slate-900">{client.cni}</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-green-500 bg-gradient-to-br from-green-50 to-emerald-50">
            <CardContent className="pt-6">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Statut</p>
              <BadgeStatut status={globalStatus} />
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Stats */}
        <div className="lg:col-span-2 grid gap-3 grid-cols-1 sm:grid-cols-2">
          <CardStat
            title="Total locations"
            value={client.rentals.length}
            icon={Home}
            variant="default"
          />
          <CardStat
            title="Revenus mensuels"
            value={client.rentals.reduce((sum, r) => sum + r.monthlyRent, 0)}
            icon={Wallet}
            variant="success"
            isCurrency
          />
          <CardStat
            title="Total cautions restantes"
            value={client.rentals.reduce((sum, r) => sum + (r.deposit.total - r.deposit.paid), 0)}
            icon={DollarSign}
            variant="warning"
            isCurrency
          />
          <Card className="border-l-4 border-l-orange-500 bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center">
            <CardContent className="pt-6 w-full">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Actions</p>
                  <Button variant="outline" size="sm" onClick={() => navigate(`/clients/${client.id}/edit`)}>
                    <Edit className="w-3 h-3 mr-1" />
                    Modifier
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon" onClick={handleArchive} title="Archiver">
                    <Archive className="w-4 h-4" />
                  </Button>
                  <Button variant="destructive" size="icon" onClick={handleBlacklist} title="Blacklister">
                    <Ban className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="rentals" className="space-y-4">
        <TabsList className="grid h-auto w-full grid-cols-2 gap-1 sm:grid-cols-4 sm:max-w-lg">
          <TabsTrigger value="rentals" className="gap-2">
            <Home className="w-4 h-4" />
            <span className="hidden sm:inline">{t('detail.rentals')}</span>
          </TabsTrigger>
          <TabsTrigger value="payments" className="gap-2">
            <CreditCard className="w-4 h-4" />
            <span className="hidden sm:inline">{t('detail.payments')}</span>
          </TabsTrigger>
          <TabsTrigger value="deposit" className="gap-2">
            <Wallet className="w-4 h-4" />
            <span className="hidden sm:inline">{t('detail.deposit')}</span>
          </TabsTrigger>
          <TabsTrigger value="documents" className="gap-2">
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">{t('detail.documents')}</span>
          </TabsTrigger>
        </TabsList>

        {/* Rentals Tab */}
        <TabsContent value="rentals">
          <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="text-lg font-semibold">{t('detail.rentals')} ({client.rentals.length})</h3>
              <Button
                size="sm"
                className="bg-secondary hover:bg-secondary/90"
                onClick={() => navigate(`/clients/${client.id}/add-rental`)}
              >
                <Plus className="w-4 h-4 mr-2" />
                {t('clients.addRental')}
              </Button>
            </div>
            {client.rentals.map((rental) => (
              <Card key={rental.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 border-b">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-3">
                        <Badge className="bg-blue-600">{t(`property.${rental.propertyType}`)}</Badge>
                        <div>
                          <h4 className="font-bold text-lg text-slate-900">{rental.propertyName}</h4>
                          <p className="text-sm text-slate-600">ID: {rental.id}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-blue-600">{formatCurrency(rental.monthlyRent)} FCFA</p>
                        <p className="text-xs text-slate-600">/mois</p>
                      </div>
                    </div>
                  </div>
                  <CardContent className="pt-4">
                    {(() => {
                      const remainingDeposit = rental.deposit.total - rental.deposit.paid
                      const isDepositFullyPaid = remainingDeposit <= 0
                      return (
                    <div className="flex flex-wrap items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
                      <div className="flex-1 min-w-[120px]">
                        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Caution totale</p>
                        <p className="text-lg font-bold text-slate-900">{formatCurrency(rental.deposit.total)} FCFA</p>
                      </div>
                      <div className="flex-1 min-w-[120px]">
                        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Caution payée</p>
                        <p className="text-lg font-bold text-green-600">{formatCurrency(rental.deposit.paid)} FCFA</p>
                      </div>
                      <div className="flex-1 min-w-[120px]">
                        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Reste à payer</p>
                        <p className="text-lg font-bold text-orange-600">{formatCurrency(Math.max(0, remainingDeposit))} FCFA</p>
                      </div>
                      <div className="flex w-full items-end gap-2 sm:w-auto">
                        <Button
                          type="button"
                          size="sm"
                          disabled={isDepositFullyPaid || actions.isLoading}
                          className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-60 sm:w-auto"
                          onClick={() => {
                            actions.openDepositModal(rental, remainingDeposit);
                          }}
                        >
                          <DollarSign className="w-4 h-4 mr-2" />
                          {isDepositFullyPaid ? 'Caution soldée' : 'Payer caution'}
                        </Button>
                        {isDepositFullyPaid ? (
                          <Button
                            type="button"
                            size="icon"
                            variant="outline"
                            title={actions.canRollback ? "Annuler la dernière action" : "Aucune action récente à annuler"}
                            disabled={actions.isRollingBack}
                            onClick={actions.handleRollbackLatestAction}
                          >
                            {actions.isRollingBack ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <RotateCcw className="h-4 w-4" />
                            )}
                          </Button>
                        ) : null}
                      </div>
                    </div>
                      )
                    })()}
                  </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments">
          <div className="space-y-4">
            {client.rentals.map((rental) => (
              <div key={rental.id} className="space-y-3">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <Badge className="bg-blue-600">{t(`property.${rental.propertyType}`)}</Badge>
                    <div>
                      <h4 className="font-bold text-lg text-slate-900">{rental.propertyName}</h4>
                      <p className="text-sm text-slate-600">{formatCurrency(rental.monthlyRent)} FCFA / mois</p>
                    </div>
                  </div>
                </div>
                <Card>
                  <CardContent className={isMobile ? 'p-3 space-y-3' : 'p-0'}>
                    {isMobile ? (
                      rental.payments.map((payment) => {
                        const status = calculatePaymentStatus(payment);
                        const isPaid = status === 'paid';
                        const isFullyPaid = payment.paidAmount >= payment.amount;
                        return (
                          <Card key={payment.id} className={`border ${isPaid ? 'bg-green-50 border-green-200' : 'border-border/70'}`}>
                            <CardContent className="p-3 space-y-3">
                              <div className="flex items-start justify-between gap-2">
                                <p className="text-sm font-semibold">
                                  {format(payment.periodStart, 'd MMM', { locale: dateLocale })} → {format(payment.periodEnd, 'd MMM yyyy', { locale: dateLocale })}
                                </p>
                                <BadgeStatut status={status} size="sm" />
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                <p>
                                  <span className="text-muted-foreground">{t('detail.dueDate')}:</span>{' '}
                                  {format(payment.dueDate, 'd MMM yyyy', { locale: dateLocale })}
                                </p>
                                <p className="text-right">
                                  <span className="text-muted-foreground">{t('detail.amount')}:</span>{' '}
                                  <span className="font-semibold">{formatCurrency(payment.amount)} FCFA</span>
                                </p>
                                <p className="col-span-2">
                                  <span className="text-muted-foreground">{t('detail.paidAmount')}:</span>{' '}
                                  <span className={`font-semibold ${isFullyPaid ? 'text-green-600' : 'text-orange-600'}`}>
                                    {formatCurrency(payment.paidAmount)} FCFA
                                  </span>
                                </p>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                {!isPaid ? (
                                  <Button
                                    type="button"
                                    size="sm"
                                    className="bg-green-600 hover:bg-green-700"
                                    onClick={() => {
                                      actions.openPaymentModal(payment, rental);
                                    }}
                                  >
                                    <DollarSign className="w-4 h-4 mr-1" />
                                    Payer
                                  </Button>
                                ) : (
                                  <Badge className="justify-center bg-green-600 py-2">Payé</Badge>
                                )}
                                {isPaid ? (
                                  <Button
                                    type="button"
                                    size="icon"
                                    variant="outline"
                                    title={actions.canRollback ? "Annuler la dernière action sur ce client" : "Aucune action récente à annuler"}
                                    disabled={actions.isRollingBack}
                                    onClick={actions.handleRollbackLatestAction}
                                  >
                                    {actions.isRollingBack ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <RotateCcw className="h-4 w-4" />
                                    )}
                                  </Button>
                                ) : (
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      actions.openEditPaymentModal(payment, rental);
                                    }}
                                  >
                                    Modifier
                                  </Button>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-slate-50">
                              <TableHead className="font-semibold">{t('detail.period')}</TableHead>
                              <TableHead className="font-semibold">{t('detail.dueDate')}</TableHead>
                              <TableHead className="font-semibold">{t('detail.amount')}</TableHead>
                              <TableHead className="font-semibold">{t('detail.paidAmount')}</TableHead>
                              <TableHead className="text-right font-semibold">{t('clients.actions')}</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {rental.payments.map((payment) => {
                              const status = calculatePaymentStatus(payment);
                              const isPaid = status === 'paid';
                              return (
                                <TableRow key={payment.id} className={isPaid ? 'bg-green-50' : 'hover:bg-slate-50'}>
                                  <TableCell className="font-medium">
                                    {format(payment.periodStart, 'd MMM', { locale: dateLocale })} → {format(payment.periodEnd, 'd MMM yyyy', { locale: dateLocale })}
                                  </TableCell>
                                  <TableCell>{format(payment.dueDate, 'd MMM yyyy', { locale: dateLocale })}</TableCell>
                                  <TableCell className="font-bold">{formatCurrency(payment.amount)} FCFA</TableCell>
                                  <TableCell>
                                    <span className={`font-bold ${payment.paidAmount >= payment.amount ? 'text-green-600' : 'text-orange-600'}`}>
                                      {formatCurrency(payment.paidAmount)} FCFA
                                    </span>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <div className="flex items-center gap-2 justify-end">
                                      {!isPaid ? (
                                        <Button
                                          type="button"
                                          size="sm"
                                          className="bg-green-600 hover:bg-green-700"
                                          onClick={() => {
                                            actions.openPaymentModal(payment, rental);
                                          }}
                                        >
                                          <DollarSign className="w-4 h-4 mr-1" />
                                          Payer
                                        </Button>
                                      ) : (
                                        <Badge className="bg-green-600">Payé</Badge>
                                      )}
                                      {isPaid ? (
                                        <Button
                                          type="button"
                                          size="icon"
                                          variant="outline"
                                          title={actions.canRollback ? "Annuler la dernière action sur ce client" : "Aucune action récente à annuler"}
                                          disabled={actions.isRollingBack}
                                          onClick={actions.handleRollbackLatestAction}
                                        >
                                          {actions.isRollingBack ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                          ) : (
                                            <RotateCcw className="h-4 w-4" />
                                          )}
                                        </Button>
                                      ) : (
                                        <Button
                                          type="button"
                                          size="sm"
                                          variant="outline"
                                          onClick={() => {
                                            actions.openEditPaymentModal(payment, rental);
                                          }}
                                        >
                                          Modifier
                                        </Button>
                                      )}
                                    </div>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Deposit Tab */}
        <TabsContent value="deposit">
          {client.rentals.map((rental) => {
            const remaining = rental.deposit.total - rental.deposit.paid;

            return (
              <Card key={rental.id} className="mb-4">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Badge variant="outline">{t(`property.${rental.propertyType}`)}</Badge>
                    {rental.propertyName}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">{t('addClient.totalDeposit')}</p>
                      <p className="text-xl font-bold">{formatCurrency(rental.deposit.total)} FCFA</p>
                    </div>
                    <div className="p-4 bg-success/10 rounded-lg">
                      <p className="text-sm text-muted-foreground">{t('addClient.paidDeposit')}</p>
                      <p className="text-xl font-bold text-success">{formatCurrency(rental.deposit.paid)} FCFA</p>
                    </div>
                    <div className={`p-4 rounded-lg ${remaining > 0 ? 'bg-warning/10' : 'bg-success/10'}`}>
                      <p className="text-sm text-muted-foreground">{t('addClient.remainingDeposit')}</p>
                      <p className={`text-xl font-bold ${remaining > 0 ? 'text-warning' : 'text-success'}`}>
                        {formatCurrency(remaining)} FCFA
                      </p>
                    </div>
                    <div className="p-4 flex flex-col justify-center items-center">
                      <div className="flex w-full items-center gap-2">
                        <Button
                          type="button"
                          disabled={remaining <= 0 || actions.isLoading}
                          className="bg-secondary hover:bg-secondary/90 w-full disabled:opacity-60"
                          size="sm"
                          onClick={() => {
                            actions.openDepositModal(rental, remaining);
                          }}
                        >
                          <DollarSign className="w-4 h-4 mr-2" />
                          {remaining > 0 ? 'Payer' : 'Soldé'}
                        </Button>
                        {remaining <= 0 ? (
                          <Button
                            type="button"
                            size="icon"
                            variant="outline"
                            title={actions.canRollback ? "Annuler la dernière action" : "Aucune action récente à annuler"}
                            disabled={actions.isRollingBack}
                            onClick={actions.handleRollbackLatestAction}
                          >
                            {actions.isRollingBack ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <RotateCcw className="h-4 w-4" />
                            )}
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents">
          <Card>
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="text-lg">{t('detail.documents')}</CardTitle>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingDoc || client.rentals.length === 0}
              >
                <Plus className="w-4 h-4 mr-2" />
                {t('document.upload')}
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                className="hidden"
                onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
              />

              {client.rentals.length === 0 ? (
                <p className="text-muted-foreground text-sm">Ajoutez une location avant de téléverser un document.</p>
              ) : (
                <div className="rounded-xl border border-border/70 bg-slate-50 p-4 space-y-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1">
                      <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Location</label>
                      <select
                        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                        value={selectedRentalId}
                        onChange={(event) => setSelectedRentalId(event.target.value)}
                      >
                        {client.rentals.map((rental) => (
                          <option key={rental.id} value={rental.id}>
                            {rental.propertyName}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Nom</label>
                      <input
                        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                        placeholder="Nom du document"
                        value={docName}
                        onChange={(event) => setDocName(event.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1">
                      <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Type</label>
                      <select
                        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                        value={docType}
                        onChange={(event) => setDocType(event.target.value as 'contract' | 'receipt' | 'other')}
                      >
                        <option value="contract">Contrat</option>
                        <option value="receipt">Reçu</option>
                        <option value="other">Autre</option>
                      </select>
                    </div>
                    <label className="flex h-10 items-center gap-2 rounded-md border border-input bg-background px-3 text-sm">
                      <input
                        type="checkbox"
                        checked={docSigned}
                        onChange={(event) => setDocSigned(event.target.checked)}
                      />
                      Document signé
                    </label>
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-muted-foreground truncate">
                      {selectedFile ? `Fichier: ${selectedFile.name}` : 'Aucun fichier sélectionné'}
                    </p>
                    <Button
                      type="button"
                      size="sm"
                      className="bg-secondary hover:bg-secondary/90"
                      onClick={handleUploadDocument}
                      disabled={isUploadingDoc || !selectedFile || !selectedRentalId}
                    >
                      {isUploadingDoc ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4 mr-2" />
                      )}
                      {isUploadingDoc ? 'Téléversement...' : t('document.upload')}
                    </Button>
                  </div>
                </div>
              )}

              {clientDocuments.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">{t('document.noDocuments')}</p>
              ) : (
                <div className="space-y-2">
                  {clientDocuments.map((doc) => (
                    <div key={doc.id} className="flex flex-col gap-2 rounded-lg border border-border/70 p-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-medium text-sm text-slate-900">{doc.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {doc.propertyName} • {doc.type} • {format(new Date(doc.uploadedAt), 'd MMM yyyy', { locale: dateLocale })}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={openingDocId === doc.id}
                        onClick={() => {
                          void handleOpenDocument(doc)
                        }}
                      >
                        {openingDocId === doc.id ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <ExternalLink className="w-4 h-4 mr-2" />
                        )}
                        Ouvrir
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

        <QuickPaymentModal
          open={actions.paymentModalOpen}
          onOpenChange={actions.setPaymentModalOpen}
          clientName={client.firstName + ' ' + client.lastName}
          propertyName={actions.selectedPayment ? actions.selectedPayment.rental.propertyName : ''}
          amountDue={actions.selectedPayment ? actions.selectedPayment.maxAmount : 0}
          onPayTotal={actions.handlePayTotal}
          onPayPartial={actions.handlePayPartial}
          isLoading={actions.isLoading}
        />

        <PaymentModal
          open={actions.editPaymentModalOpen}
          onOpenChange={actions.setEditPaymentModalOpen}
          isEdit
          maxAmount={actions.editPayment?.payment?.amount}
          defaultValues={{
            amount: String(actions.editPayment?.payment?.paidAmount || 0),
            date: new Date().toISOString().split('T')[0],
            receiptNumber: `CORR-${Date.now()}`,
            notes: 'Correction',
          }}
          onSubmit={(data) => actions.handleEditPayment(Number(data.amount))}
        />

        {/* Deposit Payment Modal */}
        <QuickPaymentModal
          open={actions.depositModalOpen}
          onOpenChange={actions.setDepositModalOpen}
          clientName={client.firstName + ' ' + client.lastName}
          propertyName={actions.selectedDeposit ? actions.selectedDeposit.rental.propertyName : ''}
          amountDue={actions.selectedDeposit ? actions.selectedDeposit.maxAmount : 0}
          onPayTotal={actions.handleDepositPayTotal}
          onPayPartial={actions.handleDepositPayPartial}
          isLoading={actions.isLoading}
        />
    </div>
  );
}
