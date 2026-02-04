import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/lib/i18n';
import { getSetting, setSetting } from '@/services/api';

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
  const [persistedTheme, setPersistedTheme] = useState<string>('');
  const [selectedTheme, setSelectedTheme] = useState<string>('');
  const [previewTheme, setPreviewTheme] = useState<string>('');
  const [loading, setLoading] = useState(true);

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

  // Only admin can change palettes
  if (!user || user.role !== 'admin') {
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
    </div>
  );
}
