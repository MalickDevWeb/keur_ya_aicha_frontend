import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/lib/i18n';
import { DEFAULT_IMPORT_ALIASES } from '@/lib/importClients';
import { getSetting, setSetting } from '@/services/api';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const AVAILABLE_THEMES = [
  { key: '', label: 'Par défaut' },
  { key: 'theme-orange', label: 'Orange' },
  { key: 'theme-dark', label: 'Sombre' },
  { key: 'theme-gray', label: 'Gris / Blanc' },
  { key: 'theme-clinic', label: 'Clinique (Noir + Orange)' },
];

export default function Settings() {
  const { user } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [persistedTheme, setPersistedTheme] = useState<string>('');
  const [selectedTheme, setSelectedTheme] = useState<string>('');
  const [previewTheme, setPreviewTheme] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [importAliasesText, setImportAliasesText] = useState<string>('');
  const [importAliasesError, setImportAliasesError] = useState<string>('');
  const [importAliasesSaving, setImportAliasesSaving] = useState(false);
  const [reportFormat, setReportFormat] = useState<'csv' | 'xlsx' | 'json'>('csv');
  const [reportFormatSaving, setReportFormatSaving] = useState(false);

  useEffect(() => {
    // Load theme from server
    async function loadTheme() {
      try {
        const theme = await getSetting('app_theme');
        const themeValue = theme || '';
        setPersistedTheme(themeValue);
        setSelectedTheme(themeValue);
        applyThemeToDocument(themeValue);
      } catch (e) {
        console.error('Failed to load theme:', e);
      } finally {
        setLoading(false);
      }
    }
    loadTheme();
  }, []);

  useEffect(() => {
    async function loadImportAliases() {
      try {
        const raw = await getSetting('import_clients_aliases');
        if (raw) {
          setImportAliasesText(raw);
        } else {
          setImportAliasesText(JSON.stringify(DEFAULT_IMPORT_ALIASES, null, 2));
        }
      } catch (e) {
        console.error('Failed to load import aliases:', e);
        setImportAliasesText(JSON.stringify(DEFAULT_IMPORT_ALIASES, null, 2));
      }
    }
    loadImportAliases();
  }, []);

  useEffect(() => {
    async function loadReportFormat() {
      try {
        const raw = await getSetting('import_report_format');
        if (raw === 'csv' || raw === 'xlsx' || raw === 'json') {
          setReportFormat(raw);
        } else {
          setReportFormat('csv');
        }
      } catch (e) {
        console.error('Failed to load import report format:', e);
        setReportFormat('csv');
      }
    }
    loadReportFormat();
  }, []);

  function applyThemeToDocument(themeKey: string) {
    const root = document.documentElement;
    ['theme-orange', 'theme-dark', 'theme-gray', 'theme-clinic', 'dark'].forEach((c) => root.classList.remove(c));
    if (themeKey) root.classList.add(themeKey);
  }

  async function persistTheme(themeKey: string) {
    try {
      setLoading(true);
      await setSetting('app_theme', themeKey);
      setPersistedTheme(themeKey);
      setSelectedTheme(themeKey);
      applyThemeToDocument(themeKey);
      setPreviewTheme('');
    } catch (e) {
      console.error('Failed to save theme:', e);
    } finally {
      setLoading(false);
    }
  }

  async function saveImportAliases() {
    setImportAliasesError('');
    let parsed: any;
    try {
      parsed = JSON.parse(importAliasesText);
      if (!parsed || typeof parsed !== 'object') {
        throw new Error('Format JSON invalide.');
      }
    } catch (e: any) {
      setImportAliasesError(e?.message || 'JSON invalide.');
      return;
    }
    try {
      setImportAliasesSaving(true);
      await setSetting('import_clients_aliases', JSON.stringify(parsed));
    } catch (e) {
      console.error('Failed to save import aliases:', e);
      setImportAliasesError('Échec de sauvegarde.');
    } finally {
      setImportAliasesSaving(false);
    }
  }

  function resetImportAliases() {
    setImportAliasesText(JSON.stringify(DEFAULT_IMPORT_ALIASES, null, 2));
    setImportAliasesError('');
  }

  async function saveReportFormat() {
    try {
      setReportFormatSaving(true);
      await setSetting('import_report_format', reportFormat);
    } catch (e) {
      console.error('Failed to save import report format:', e);
    } finally {
      setReportFormatSaving(false);
    }
  }

  // Only admin can change palettes
  const role = String(user?.role || '').toUpperCase();
  if (!user || (role !== 'ADMIN' && role !== 'SUPER_ADMIN')) {
    return (
      <div className="p-6">
        <h2 className="text-2xl font-bold">Paramètres</h2>
        <p className="mt-4 text-muted-foreground">Vous n'êtes pas autorisé à modifier la palette.</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold">Paramètres</h2>
      <section className="mt-6">
        <h3 className="font-medium">Palette</h3>
        <p className="text-sm text-muted-foreground mt-2">Palette actuelle: {persistedTheme || 'Par défaut'}</p>

        <div className="flex gap-3 flex-wrap mt-3 items-center">
          {AVAILABLE_THEMES.map((th) => (
            <div key={th.key || 'default'} className="flex items-center gap-2">
              <Button
                variant={selectedTheme === th.key ? 'secondary' : 'ghost'}
                onClick={() => {
                  setSelectedTheme(th.key);
                  setPreviewTheme(th.key);
                }}
              >
                {th.label}
              </Button>
            </div>
          ))}

          <Button variant="outline" onClick={() => { setSelectedTheme(''); setPreviewTheme(''); persistTheme(''); }}>
            Réinitialiser
          </Button>
        </div>

        <div className="mt-4 flex gap-2 items-center">
          <Button onClick={() => persistTheme(selectedTheme)} disabled={selectedTheme === persistedTheme}>
            Appliquer la palette
          </Button>
          <Button variant="ghost" onClick={() => setPreviewTheme('')}>Annuler l'aperçu</Button>
        </div>

        <div className="mt-6">
          <h4 className="font-medium">Aperçu</h4>
          <div className="mt-3 p-4 rounded-md border" aria-live="polite">
            <div className={previewTheme || persistedTheme ? previewTheme || persistedTheme : ''}>
              <div className="p-4 rounded-md bg-card">
                <h5 className="text-lg font-semibold">Titre d'exemple</h5>
                <p className="text-sm mt-2">Texte d'exemple — couleurs et surfaces</p>
                <div className="mt-3 flex gap-2">
                  <div className="w-12 h-8 rounded" style={{ background: 'hsl(var(--primary))' }} />
                  <div className="w-12 h-8 rounded" style={{ background: 'hsl(var(--accent))' }} />
                  <div className="w-12 h-8 rounded" style={{ background: 'hsl(var(--muted))' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-10">
        <h3 className="font-medium">Format d'import Excel</h3>
        <p className="text-sm text-muted-foreground mt-2">
          Définissez les alias de colonnes pour l'import. Exemple: si votre fichier contient "CN1",
          ajoutez-le dans la liste de <span className="font-medium">cni</span>.
        </p>

        <div className="mt-4 space-y-3">
          <Textarea
            rows={10}
            value={importAliasesText}
            onChange={(e) => setImportAliasesText(e.target.value)}
            placeholder="JSON d'alias des colonnes"
          />
          {importAliasesError && (
            <p className="text-sm text-destructive">{importAliasesError}</p>
          )}
          <div className="flex gap-2 flex-wrap">
            <Button onClick={saveImportAliases} disabled={importAliasesSaving}>
              Enregistrer le format
            </Button>
            <Button variant="outline" onClick={resetImportAliases}>
              Réinitialiser par défaut
            </Button>
            <Button variant="secondary" onClick={() => navigate('/import/clients')}>
              Ouvrir l'import clients
            </Button>
          </div>
        </div>
      </section>

      <section className="mt-10">
        <h3 className="font-medium">Format du rapport d'import</h3>
        <p className="text-sm text-muted-foreground mt-2">
          Choisissez le format de téléchargement pour la page d'erreurs d'import.
        </p>

        <div className="mt-4 flex items-center gap-3 flex-wrap">
          <Select value={reportFormat} onValueChange={(value) => setReportFormat(value as 'csv' | 'xlsx' | 'json')}>
            <SelectTrigger className="w-[240px]">
              <SelectValue placeholder="Choisir un format" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="csv">CSV</SelectItem>
              <SelectItem value="xlsx">Excel (XLSX)</SelectItem>
              <SelectItem value="json">JSON</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={saveReportFormat} disabled={reportFormatSaving}>
            Enregistrer
          </Button>
        </div>
      </section>
    </div>
  );
}
