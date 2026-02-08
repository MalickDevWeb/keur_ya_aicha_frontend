import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer, User, Upload, MessageCircle } from 'lucide-react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Separator } from '@/components/ui/separator';
import { useI18n } from '@/lib/i18n';
import { useData } from '@/contexts/DataContext';
import { PropertyType, formatCurrency } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { generatePdfForDocument, downloadBlob, shareBlobViaWebShare } from '@/lib/pdfUtils';
import {
  formatPhoneNumber,
  formatCNI,
  formatName,
  validateSenegalNumber,
  validateCNI,
  validateName,
  validatePropertyName,
  validateEmail,
} from '@/validators/clientValidator';

const formSchema = z.object({
  lastName: z
    .string()
    .min(1, 'Le nom est requis')
    .refine(validateName, 'Le nom doit contenir au moins 2 lettres (pas de chiffres)'),
  firstName: z
    .string()
    .min(1, 'Le prénom est requis')
    .refine(validateName, 'Le prénom doit contenir au moins 2 lettres (pas de chiffres)'),
  phone: z
    .string()
    .min(1, 'Le numéro de téléphone est requis')
    .refine(validateSenegalNumber, 'Numéro sénégalais invalide. Format: +221 77 123 45 67'),
  cni: z
    .string()
    .min(1, 'La CNI est requise')
    .refine(validateCNI, 'La CNI doit contenir 13 caractères alphanumériques'),
  email: z.string().optional().refine((value) => !value || validateEmail(value), 'Email invalide'),
  propertyType: z.enum(['studio', 'room', 'apartment', 'villa', 'other']),
  propertyName: z
    .string()
    .min(1, 'Le nom du bien est requis')
    .refine(validatePropertyName, 'Le nom du bien est invalide'),
  startDate: z.string().min(1, 'La date de début est requise'),
  monthlyRent: z.number().min(1000, 'Le loyer minimum est 1000'),
  totalDeposit: z.number().min(0, 'La caution totale invalide'),
  paidDeposit: z.number().min(0, 'La caution payée invalide'),
}).refine((data) => data.paidDeposit <= data.totalDeposit, {
  message: 'La caution payée ne peut pas dépasser le total',
  path: ['paidDeposit'],
});

type FormData = z.infer<typeof formSchema>;

export default function AddClient() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const { addClient } = useData();
  const { toast } = useToast();
  const [createdClient, setCreatedClient] = useState<{
    id: string;
    name: string;
    phone: string;
    propertyName: string;
    monthlyRent: number;
    startDate: string;
  } | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      lastName: '',
      firstName: '',
      phone: '',
      cni: '',
      email: '',
      propertyType: 'apartment',
      propertyName: '',
      startDate: new Date().toISOString().split('T')[0],
      monthlyRent: 100000,
      totalDeposit: 200000,
      paidDeposit: 0,
    },
  });

  const totalDeposit = form.watch('totalDeposit');
  const paidDeposit = form.watch('paidDeposit');
  const remainingDeposit = Math.max(0, totalDeposit - paidDeposit);

  const onSubmit = async (data: FormData) => {
    console.log('🔵 [AddClient] onSubmit clicked with form data:', {
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      email: data.email,
      propertyName: data.propertyName,
      monthlyRent: data.monthlyRent,
      totalDeposit: data.totalDeposit,
      paidDeposit: data.paidDeposit,
    });
    try {
      const newClient = await addClient({
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        cni: data.cni,
        email: data.email,
        status: 'active',
        rental: {
          propertyType: data.propertyType as PropertyType,
          propertyName: data.propertyName,
          startDate: new Date(data.startDate),
          monthlyRent: data.monthlyRent,
          deposit: {
            total: data.totalDeposit,
            paid: data.paidDeposit,
            payments: data.paidDeposit > 0 ? [{
              id: crypto.randomUUID(),
              amount: data.paidDeposit,
              date: new Date(),
              receiptNumber: `DEP-${Date.now().toString(36).toUpperCase()}`,
            }] : [],
          },
        },
      });
      console.log('✅ [AddClient] Client created successfully:', newClient);
      setCreatedClient({
        id: newClient.id,
        name: `${data.firstName} ${data.lastName}`,
        phone: data.phone,
        propertyName: data.propertyName,
        monthlyRent: data.monthlyRent,
        startDate: data.startDate,
      });

      toast({
        title: t('common.success'),
        description: `Client ${data.firstName} ${data.lastName} créé avec succès`,
      });
    } catch (error) {
      console.error('❌ [AddClient] Error creating client:', error);
      toast({
        title: 'Erreur',
        description: 'Erreur lors de la création du client',
        variant: 'destructive',
      });
    }
  };

  const handlePrintContract = async () => {
    try {
      const values = form.getValues();
      const doc = {
        clientName: `${values.firstName} ${values.lastName}`,
        clientPhone: values.phone,
        property: values.propertyName,
        propertyType: values.propertyType,
        startDate: values.startDate,
        amount: values.monthlyRent,
        note: `Contrat de location pour ${values.propertyName} - Début: ${new Date(values.startDate).toLocaleDateString('fr-FR')}`,
        uploadedAt: Date.now(),
      };

      const blob = await generatePdfForDocument(doc);

      // Try Web Share first (mobile); otherwise download and open in new tab for printing
      const filename = `contrat_${values.lastName}_${values.firstName}.pdf`;
      const shared = await shareBlobViaWebShare(blob, filename, 'Contrat de location');
      if (!shared) {
        downloadBlob(blob, filename);
        // Also open in new tab so user can print directly
        const url = URL.createObjectURL(blob);
        const win = window.open(url, '_blank', 'noopener,noreferrer');
        if (win) {
          try { win.opener = null; } catch {}
        }
        setTimeout(() => URL.revokeObjectURL(url), 10000);
      }

      toast({
        title: 'Impression',
        description: 'Le contrat a été généré et téléchargé.',
      });
    } catch (e: any) {
      console.error('Print contract failed', e);
      toast({
        title: 'Erreur',
        description: e?.message || 'Impossible de générer le contrat. Installez html2canvas et jspdf si nécessaire.',
      });
    }
  };

  const handleSendWhatsApp = () => {
    if (!createdClient) return;

    // Extract first name from the full name
    const nameParts = createdClient.name.split(' ');
    const firstName = nameParts[0];

    const phone = createdClient.phone.replace(/[^\d+]/g, '');
    const message = encodeURIComponent(
      `Bonjour ${firstName},\n\nVotre contrat de location pour ${createdClient.propertyName} est prêt !\n\nDétails :\n- Loyer mensuel : ${createdClient.monthlyRent.toLocaleString()} FCFA\n- Date de début : ${new Date(createdClient.startDate).toLocaleDateString('fr-FR')}\n\nPour toute question, contactez-nous.\n\nKeur Ya Aicha - Location Immobilier & Services`
    );

    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
  };

  if (createdClient) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mb-4">
              <User className="w-8 h-8 text-success" />
            </div>
            <CardTitle className="text-success">{t('common.success')} !</CardTitle>
            <CardDescription>
              Client {createdClient.name} créé avec succès
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              variant="outline"
              className="w-full"
              onClick={handleSendWhatsApp}
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Envoyer WhatsApp
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={handlePrintContract}
            >
              <Printer className="w-4 h-4 mr-2" />
              {t('addClient.printContract')}
            </Button>
            <Button
              className="w-full bg-secondary hover:bg-secondary/90"
              onClick={() => navigate(`/clients/${createdClient.id}`)}
            >
              Voir le dossier client
            </Button>
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => {
                setCreatedClient(null);
                form.reset();
              }}
            >
              Ajouter un autre client
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold text-foreground">{t('addClient.title')}</h1>
        </div>
        <Button variant="outline" onClick={() => navigate('/import/clients')}>
          <Upload className="w-4 h-4 mr-2" />
          Importer Excel
        </Button>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Personal Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('addClient.personalInfo')}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('clients.name')}</FormLabel>
                    <FormControl>
                      <Input placeholder="Diallo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('clients.firstName')}</FormLabel>
                    <FormControl>
                      <Input placeholder="Amadou" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('clients.phone')}</FormLabel>
                    <FormControl>
                      <Input placeholder="+221 77 123 45 67" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="cni"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('clients.cni')}</FormLabel>
                    <FormControl>
                      <Input placeholder="1234567890123" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('clients.email')} (optionnel)</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="nom@email.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Rental Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('addClient.rentalInfo')}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="propertyType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('addClient.propertyType')}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="studio">{t('property.studio')}</SelectItem>
                        <SelectItem value="room">{t('property.room')}</SelectItem>
                        <SelectItem value="apartment">{t('property.apartment')}</SelectItem>
                        <SelectItem value="villa">{t('property.villa')}</SelectItem>
                        <SelectItem value="other">{t('property.other')}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="propertyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('addClient.property')}</FormLabel>
                    <FormControl>
                      <Input placeholder="Appartement A1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('addClient.startDate')}</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="monthlyRent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('addClient.monthlyRent')} (FCFA)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Deposit Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('addClient.depositInfo')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="totalDeposit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('addClient.totalDeposit')} (FCFA)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="paidDeposit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('addClient.paidDeposit')} (FCFA)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <span className="font-medium">{t('addClient.remainingDeposit')}</span>
                <span className={`text-lg font-bold ${remainingDeposit > 0 ? 'text-warning' : 'text-success'}`}>
                  {formatCurrency(remainingDeposit)} FCFA
                </span>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => navigate(-1)}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-secondary hover:bg-secondary/90"
            >
              {t('addClient.submit')}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
