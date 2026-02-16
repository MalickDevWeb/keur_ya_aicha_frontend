# Palette et thèmes

Ce dépôt utilise des variables CSS centralisées définies dans `src/index.css`.

Thèmes disponibles (classes à appliquer sur `<html>` ou `<body>`):

- `theme-orange` : palette chaude (orange)
- `theme-dark` : thème sombre (noir)
- (défaut) : palette principale définie sur `:root`
- `dark` : variante sombre existante (utilisée par la bascule `darkMode`)

Comment activer un thème :

1. Dans votre fichier HTML (ex. `index.html`) ou via JavaScript, ajoutez la classe sur l'élément `html` ou `body`.

Exemple (HTML) :

```html
<html class="theme-orange">
  <!-- ... -->
</html>
```

Exemple (JavaScript) :

```js
// Activer le thème orange
document.documentElement.classList.remove('theme-dark', 'dark')
document.documentElement.classList.add('theme-orange')

// Activer le thème sombre
document.documentElement.classList.remove('theme-orange', 'dark')
document.documentElement.classList.add('theme-dark')

// Revenir au thème par défaut
document.documentElement.classList.remove('theme-orange', 'theme-dark')
```

Remarque : `tailwind.config.ts` mappe les couleurs sémantiques (par ex. `primary`, `secondary`, `success`, `warning`, `destructive`) aux variables CSS.

Pour changer la palette globale, modifiez les HSL values sous `:root` ou sous `.
theme-orange` / `.theme-dark` dans `src/index.css`.

## Gris / Blanc

Ajoutez la palette neutre gris/blanc en utilisant la classe `theme-gray`. Cette palette est utile pour les interfaces sobres, tableaux, et arrière-plans clairs.

Exemple à ajouter dans `src/index.css` (valeurs HSL / couleurs exemples) :

```css
/* Gris / Blanc */
.theme-gray {
  /* arrière-plan */
  --bg: 0 0% 100%; /* blanc */
  --bg-muted: 0 0% 98%; /* très léger gris */

  /* bordures / surfaces */
  --border: 210 10% 88%; /* gris clair */
  --muted: 210 8% 70%; /* texte secondaire */

  /* texte */
  --text: 210 5% 12%; /* texte principal sombre */

  /* accents */
  --primary: 210 6% 16%; /* accent principal (foncé) */
  --accent: 210 8% 24%; /* accent secondaire */
}
```

Pour appliquer la palette dans une page HTML :

```html
<html class="theme-gray">
  <!-- ... -->
</html>
```

Si vous voulez, je peux aussi injecter ces variables directement dans `src/index.css`.

---

## Palette Clinique — Noir + Orange

Cette palette est conçue pour une application médicale professionnelle : contraste élevé, hiérarchie claire et tons accessibles.

Couleurs Principales

| Couleur          |  Code Hex | Utilisation                                   |
| ---------------- | --------: | --------------------------------------------- |
| Primary (Orange) | `#ff6b2c` | Couleur principale, accents, bordures actives |
| Secondary (Noir) | `#1a1a1a` | Texte principal, sidebar, éléments sombres    |
| Background       | `#f8f9fa` | Fond de page (mode clair)                     |
| Foreground       | `#1a1a1a` | Texte par défaut                              |

Couleurs Secondaires

| Couleur          |      Code | Utilisation                   |
| ---------------- | --------: | ----------------------------- |
| Card             | `#ffffff` | Cartes et conteneurs          |
| Muted            | `#f3f4f6` | Éléments désactivés / neutres |
| Muted Foreground | `#6b7280` | Texte secondaire              |
| Accent           | `#fff3ed` | Surbrillance (très clair)     |
| Destructive      | `#dc2626` | Erreurs, actions dangereuses  |

Palette Graphiques/Statistiques

| Graphique | Couleur |      Code |
| --------- | ------- | --------: |
| Chart 1   | Orange  | `#ff6b2c` |
| Chart 2   | Bleu    | `#3b82f6` |
| Chart 3   | Vert    | `#10b981` |
| Chart 4   | Violet  | `#8b5cf6` |
| Chart 5   | Ambre   | `#f59e0b` |

Éléments Spécialisés

| Élément           | Couleur          |                  Code |
| ----------------- | ---------------- | --------------------: |
| Sidebar (fond)    | Noir foncé       |             `#1a1a1a` |
| Sidebar (accent)  | Gris foncé       |             `#2d2d2d` |
| Switch Background | Gris clair       |             `#e5e7eb` |
| Border            | Noir transparent | `rgba(0, 0, 0, 0.08)` |
| Ring (focus)      | Orange           |             `#ff6b2c` |

Border Radius (Arrondi)

- Standard: `0.625rem` (10px)

Mode Sombre (Dark Mode)

L'application supporte un mode sombre avec des couleurs OkLCh adaptées pour une meilleure accessibilité et réduction de la fatigue oculaire.

Caractéristiques

- Design épuré : Combinaison Noir + Orange moderne
- Hiérarchie claire : Contraste fort entre les éléments
- Accessible : Respecte les normes WCAG
- Cohérent : Cohérence à travers tous les dashboards
- Professionnelle : Appropriée pour une application médicale clinique

Pour intégrer cette palette au projet, j'ai ajouté la classe `.theme-clinic` dans `src/index.css`. Appliquez-la via :

```html
<html class="theme-clinic">
  <!-- ... -->
</html>
```
