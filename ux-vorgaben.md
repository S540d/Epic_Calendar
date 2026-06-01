---
# UX/Design-Vorgaben für Projekte

Allgemeine UX/UI Standards für konsistente, benutzerfreundliche Interfaces über alle Projekte hinweg.

> **Zuletzt aktualisiert:** 2026-01-07
> **Hinweis:** Technische Implementierungsdetails (Android Edge-to-Edge, OTA Updates, App Links, etc.) finden sich in [technische_vorgaben.md](technische_vorgaben.md)
> **Konsolidierung:** Diese Datei integriert nun auch Inhalte aus design-system.md und DESIGN_GUIDELINES.md für eine einheitliche UX-Dokumentation

---

## Design Fundamentals

### Design Philosophy
- **Mobile First:** Entwickle zunächst für Mobilgeräte (320px+), dann Tablet (768px+), dann Desktop (1024px+)
- **Progressive Enhancement:** Funktionalität sollte auch mit JavaScript-Errors noch funktionieren
- **Einfachheit:** Minimalist Design, entferne unnötige Elemente
- **Konsistenz:** Ein einheitliches Design-System über alle Screens hinweg
- **Feedback:** Jede Benutzeraktion sollte sichtbares Feedback bekommen

---

## 🎨 Moderne Design-Systeme (2024/2025)

> **Neu hinzugefügt:** Drei moderne Design-Ansätze für zeitgemäße Apps

### Option 1: "Soft & Modern" ⭐ **EMPFOHLEN**

**Philosophie**: Warme, sanfte Ästhetik mit subtiler Tiefe und Eleganz

#### Farbpalette
- **Backgrounds**:
  - Light: `#FAFAFA` (cremeweiß, nicht pures Weiß)
  - Dark: `#0A0A0A` (dunkelgrau, nicht pures Schwarz)
- **Surfaces**:
  - Light: `#F5F5F5` → `#EFEFEF` (weicherer Kontrast)
  - Dark: `#1A1A1A` → `#252525` (wärmere Töne)
- **Schatten**: Weiche, mehrschichtige Elevation
  - Small: `shadowOpacity: 0.08, shadowRadius: 8, elevation: 2`
  - Medium: `shadowOpacity: 0.12, shadowRadius: 16, elevation: 4`
  - Large: `shadowOpacity: 0.18, shadowRadius: 24, elevation: 8`

#### Border & Spacing
- **Border-Radius** (Material 3 Standard):
  - Primary Buttons: `28px` (hochgerundet)
  - Secondary Buttons: `20px` (gerundet)
  - Cards: `20-24px`
  - Answer/Input Boxes: `16px`
  - Settings Menu: `20px`
  - Small Elements: `8-10px`
- **Margins**: 8px Grid-System beibehalten
- **Padding**: Großzügiger (min. 16px für Cards)
- **Button Borders (Outlined):** `2px solid`

#### Visuelle Effekte
- **Glassmorphism-Tooltips**:
  ```tsx
  backgroundColor: Platform.select({
    web: 'rgba(255, 255, 255, 0.85)',
    default: colors.surface
  }),
  backdropFilter: 'blur(10px)', // nur Web
  shadowColor: '#000',
  shadowOpacity: 0.15,
  shadowRadius: 20,
  ```

- **Gradient-Accents** für wichtige Elemente:
  ```tsx
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%)
  // oder React Native: react-native-linear-gradient
  ```

- **Grid-Lines**:
  - Gestrichelt statt solid: `strokeDasharray="4,8"`
  - Opacity: `0.15` (statt 0.3)
  - Weichere Farbe: `#D0D0D0` (Light), `#404040` (Dark)

#### Interaktive Elemente
- **Hover-States** (Web):
  - Smooth Transition: `transition: all 0.2s ease`
  - Subtle Scale: `transform: scale(1.02)`
  - Brightness Shift: `filter: brightness(1.05)`

- **Buttons**:
  - Primary: Gradient oder Solid mit Schatten
  - Secondary: Border mit Hover-Fill
  - Ghost: Transparent mit Hover-Background

#### Typography
- **Font-Weights**:
  - Headings: `600-700` (semibold-bold)
  - Body: `400-500` (regular-medium)
  - Labels: `500-600` (medium-semibold)
- **Größen**: Skalierbar, min. 14px für Body Text

---

### Option 2: "Minimal & Clean"

**Philosophie**: Reduktion auf das Wesentliche, maximale Klarheit

#### Farbpalette
- **Monochrome Base**: Grauskala mit einem Akzent
  - Background: `#FFFFFF` / `#0D0D0D`
  - Surface: Nur 2-3 Graustufen
  - Accent: Eine kräftige Farbe (z.B. `#0066FF`)

#### Layout-Prinzipien
- **Mehr Whitespace**: Mindestens 24px zwischen Sections
- **Dünne Linien**: `1px` statt `2px`, Opacity `0.1-0.2`
- **Flache Hierarchie**: Maximal 2-3 Ebenen
- **Card-Based**: Jeder Inhalt in separaten, leicht abgesetzten Cards

#### Besonderheiten
- **Floating Action Buttons**: Primäre Aktionen als FAB
- **Icon-First**: Icons für schnelle Erkennung
- **Minimale Schatten**: Nur `elevation: 1-2`

**⚠️ Einschränkung**: Weniger geeignet für komplexe Datenvisualisierungen mit vielen Kategorien/Farben

---

### Option 3: "Glassmorphism & Modern"

**Philosophie**: Transluzenz und Tiefe durch Blur-Effekte

#### Visuelle Charakteristik
- **Transluzente Cards**:
  ```tsx
  backgroundColor: 'rgba(255, 255, 255, 0.1)',
  backdropFilter: 'blur(20px)',
  borderWidth: 1,
  borderColor: 'rgba(255, 255, 255, 0.2)'
  ```

- **Frosted Glass**: Hintergründe scheinen durch
- **Leuchtende Akzente**: Neon-ähnliche Highlights
- **Gradient-Overlays**: Farbverläufe überall

#### Animationen
- **Smooth Transitions**: `0.3-0.5s cubic-bezier`
- **Micro-Interactions**: Subtile Reaktionen auf Inputs
- **Parallax-Effekte**: Leichte Bewegung bei Scroll

**⚠️ Einschränkung**:
- Performance-intensiv auf älteren Geräten
- Nur teilweise auf React Native umsetzbar (Web bevorzugt)
- Kann von Inhalten ablenken

---

### 🎯 Empfehlungen nach Anwendungsfall

| Anwendungsfall | Empfohlene Option | Begründung |
|----------------|-------------------|------------|
| **Daten-Apps** (Charts, Analytics) | **Option 1** | Balanciert Ästhetik und Funktionalität |
| **Content-Apps** (News, Blogs) | Option 2 | Fokus auf Lesbarkeit |
| **Portfolio/Showcase** | Option 3 | Wow-Effekt, visuell beeindruckend |
| **Business/Professional** | Option 1 oder 2 | Seriös und modern |
| **Creative/Artistic** | Option 3 | Experimentell und einzigartig |

---

## Farbpalette (Color System)

### Grundprinzipien
- Definiere eine primäre Farbpalette mit max. 5 Hauptfarben
- Nutze nur HSL/RGB, keine willkürlichen Hex-Werte
- Dokumentiere alle Farben in `design-tokens.json` oder CSS Variables

### Semantische Farben
```css
/* Statusfarben */
--color-success: #10b981;  /* Grün: Erfolg, Bestätigung */
--color-warning: #f59e0b;  /* Gelb/Orange: Warnung, Achtung */
--color-danger: #ef4444;   /* Rot: Fehler, Löschung */
--color-info: #3b82f6;     /* Blau: Informationen, Links */

/* Neutral */
--color-bg-primary: #ffffff;     /* Light Mode Background */
--color-bg-secondary: #f9fafb;   /* Light Mode Secondary BG */
--color-text-primary: #111827;   /* Light Mode Text */
--color-text-secondary: #6b7280; /* Light Mode Secondary Text */
```

### Kontrast-Anforderungen (WCAG 2.1)
- **Normal Text:** Mindestens 4.5:1 Kontrast
- **Large Text:** Mindestens 3:1 Kontrast
- **UI Components:** Mindestens 3:1 für aktive Elemente
- **Tools zur Überprüfung:** [Accessible Colors](https://accessible-colors.com/), [Contrast Ratio](https://contrast-ratio.com/)

---

## Theme-Aware Colors Architecture ⭐

> **Pattern entdeckt und erfolgreich implementiert:** EnergyPriceGermany
> **Anwendbar auf:** React Native / Expo Apps mit Tooltip-/Modal-Overlays

### Problem (Anti-Pattern)

❌ **Nicht empfohlen:** Komponenten mit einzelnen Farb-Strings und hardcoded Dark/Light Mode Logik
- Tooltips/Overlays haben unzureichenden Kontrast in Licht/Dunkel-Modus-Kombinationen
- Keine Zugriff auf das vollständige Theme System
- Farben-Logik muss in jeder Komponente dupliziert werden

### Lösung: Theme-Aware Colors Pattern ✅

**Empfohlen:** Komponenten erhalten das komplette `ThemeColors` Objekt

#### 1. Theme Colors Typ definieren

```typescript
// utils/theme.ts
export interface ThemeColors {
  background: string;      // Main background color
  surface: string;         // Card/Surface background
  text: string;           // Primary text color
  textSecondary: string;  // Secondary/dimmed text
  primary: string;        // Primary accent color
  gridLine: string;       // Grid lines, borders
}
```

#### 2. Komponenten-Interface erweitern

```typescript
// components/MyChart.tsx
interface MyChartProps {
  backgroundColor: string;
  textColor: string;
  gridColor: string;
  colors: ThemeColors;  // ← ADD THIS
}
```

#### 3. Tooltips mit Theme-Aware Farben

```typescript
// Intelligente Tooltip-Hintergrund-Auswahl
const tooltipBgColor = backgroundColor === colors.surface
  ? colors.background
  : colors.surface;

return (
  <View style={{
    backgroundColor: tooltipBgColor,  // ← Uses theme
    borderColor: colors.gridLine,     // ← Uses theme
    // ...
  }}>
    <Text style={{ color: colors.text }}>
      Börsenpreis: 45,50 ¢
    </Text>
  </View>
);
```

#### 4. Parent-Komponente aktualisieren

```typescript
// App.tsx
<MyChart
  backgroundColor={colors.surface}
  textColor={colors.text}
  gridColor={colors.gridLine}
  colors={colors}  // ← Pass complete theme object
/>
```

### Vorteile

✅ **Single Source of Truth** - Alle Farben zentral
✅ **WCAG AA Compliance** - Automatische Light/Dark Mode Unterstützung
✅ **Wartbarkeit** - Nur eine Theme-Datei ändern
✅ **Skalierbar** - Neue Farben automatisch verfügbar

### Referenz-Implementierung

Siehe EnergyPriceGermany Project:
- **GitHub Commit:** [Apply theme-aware colors pattern](https://github.com/S540d/Energy_Price_Germany/commit/4f6e51c)
- **Dateien:** `utils/theme.ts`, `components/charts/`.

---

## Typography (Schrift)

### Font Selection
- **Maximal 2 Schriftarten:** Eine für Headings, eine für Body Text
- **Web Safe Fonts:** System Fonts oder Google Fonts mit Fallback
- **Font Size Scale:** Basierend auf 16px Base Size:
  ```css
  --font-xs: 0.75rem;   /* 12px - kleine Labels */
  --font-sm: 0.875rem;  /* 14px - small text */
  --font-base: 1rem;    /* 16px - body text */
  --font-lg: 1.125rem;  /* 18px - emphasis */
  --font-xl: 1.25rem;   /* 20px - subheadings */
  --font-2xl: 1.5rem;   /* 24px - section titles */
  --font-3xl: 1.875rem; /* 30px - page titles */
  ```

### Line Height & Spacing
- **Body Text:** 1.5 - 1.6 line-height (lesbar)
- **Headings:** 1.2 - 1.3 line-height
- **Letter Spacing:** Normal (0) für Body, 0.02em für Headings
- **Paragraph Spacing:** 1.5x Font Size (z.B. 24px bei 16px Font)

---

## Spacing System (Whitespace)

### 8px Base Grid
Basiere alle Abstände auf 8px Inkremente:

```css
--space-0: 0;      /* 0px */
--space-1: 0.25rem; /* 4px */
--space-2: 0.5rem;  /* 8px */
--space-3: 0.75rem; /* 12px */
--space-4: 1rem;    /* 16px */
--space-6: 1.5rem;  /* 24px */
--space-8: 2rem;    /* 32px */
--space-12: 3rem;   /* 48px */
--space-16: 4rem;   /* 64px */
```

### Anwendung
- **Button Padding:** 8px (vertical) × 16px (horizontal) mindestens
- **Card Padding:** 16px - 24px
- **Container Margin:** 16px (mobile), 32px (desktop)
- **Gap zwischen Items:** 8px - 16px
- **Section Spacing:** 32px - 64px

---

## Responsive Design Breakpoints

```css
/* Mobile-First Breakpoints */
--bp-sm: 320px;   /* Mobile */
--bp-md: 768px;   /* Tablet Portrait */
--bp-lg: 1024px;  /* Tablet Landscape / Small Desktop */
--bp-xl: 1280px;  /* Desktop */
--bp-2xl: 1536px; /* Large Desktop */
```

### Layout-Richtlinien
- **Mobile (< 768px):** Single Column, Full Width, 16px Margins
- **Tablet (768px - 1024px):** 2-3 Columns, Flexible Layout
- **Desktop (> 1024px):** Multi-Column, Max Width 1200px

---

## Komponenten Standards

### Buttons
- **Größe:** Minimum 44px × 44px (Apple HIG, WCAG Touch Target)
- **Padding:** 8px - 12px (vertical), 16px - 24px (horizontal)
- **Zustand:** Default, Hover, Active, Disabled, Loading
- **Label:** Kurz, actionsorientiert (z.B. "Save", "Delete", "Cancel")
- **Icon + Text:** Icon links, Text rechts mit 8px Gap

### Form Elements (Input, Textarea, Select)
- **Größe:** 40px - 44px Height (Touch-friendly)
- **Padding:** 8px - 12px
- **Border:** 1px solid, 4px border-radius
- **Focus State:** Visible Focus Ring (min. 2px, 2px offset)
- **Label:** Immer vorhanden, über Input, `for` Attribut
- **Error State:** Rote Border + Error Message unter Input

### Cards
- **Padding:** 16px - 24px
- **Border:** 1px solid (#e5e7eb) oder Box-Shadow
- **Border-Radius:** 8px - 12px
- **Spacing:** 16px - 24px zwischen Cards

### Modals / Dialogs
- **Width:** 90vw max 512px (mobile), 600px (desktop)
- **Padding:** 24px - 32px
- **Header:** Bold, 18px - 20px Font
- **Close Button:** X Icon, top-right, 40px × 40px
- **Backdrop:** Dunkelgrau mit 70% Opacity
- **Animation:** Fade-in (200ms)

### Navigation
- **Height:** 56px - 64px auf Mobile, 60px - 80px auf Desktop
- **Links:** Clear, Underline on Hover
- **Active State:** Farbe oder Underline
- **Mobile Menu:** Hamburger Icon, Slide-out oder Modal

---

## Dark Mode / Theme Support

### Implementation
- **CSS Variables:** Nutze CSS Custom Properties für Farbwechsel
- **Klasse-basiert:** `.dark` Klasse auf `<html>` oder `<body>`
- **localStorage:** Speichere Theme-Präferenz mit Key `theme`
- **OS Preference:** Nutze `prefers-color-scheme` Media Query als Fallback

### Dark Mode Farben
```css
:root {
  --color-bg: #ffffff;
  --color-text: #111827;
}

[data-theme="dark"] {
  --color-bg: #1f2937;
  --color-text: #f3f4f6;
}
```

### Dark Mode Rules
- **Nicht einfach invertieren:** Nutze Farbgestaltung statt Inversion
- **Contrast:** Stelle sicher, dass Kontrast in beiden Modes 4.5:1+ ist
- **Icons:** Können gleich bleiben, aber Farbe anpassen

---

## Barrierefreiheit (Accessibility / WCAG 2.1 AA)

### Keyboard Navigation
- **Alle Features:** Müssen mit Tastatur bedienbar sein
- **Tab Order:** Logische Reihenfolge (von oben nach unten)
- **Focus Ring:** Sichtbar, mindestens 2px, Kontrast mindestens 3:1
- **Escape:** Schließt Modals, Dropdowns
- **Enter/Space:** Aktiviert Buttons, Checkboxes

### Screen Reader Support
- **Semantic HTML:** Nutze `<button>`, `<nav>`, `<main>`, `<article>` statt `<div>`
- **ARIA Labels:** `aria-label` für Icons, `aria-labelledby` für Gruppen
- **ARIA Live:** `aria-live="polite"` für dynamische Updates
- **Headings:** `<h1>` (1x pro Seite), dann `<h2>`, `<h3>`, keine Lücken
- **Lists:** Nutze `<ul>`, `<ol>` für Listen

### Color & Contrast
- **Kontrast:** Text 4.5:1 (normal), 3:1 (large, UI components)
- **Color Only:** Informationen nicht nur durch Farbe vermitteln (auch Icon)
- **Focus Ring:** Muss sichtbar sein
- **Disabled State:** Mindestens 3:1 Kontrast auch disabled

### Links & Buttons
- **Unterscheidbar:** Links sollten durch Farbe, Underline, oder Icon unterscheidbar sein
- **Aussagekräftig:** Link-Text sollte aussagekräftig sein ("Details lesen" statt "Mehr")
- **Touch Target:** Mindestens 44px × 44px

### Images & Multimedia
- **Alt Text:** Jedes `<img>` braucht `alt` Attribut
- **Meaningful Alt:** Beschreibe den Inhalt, nicht "image of..."
- **Videos:** Subtitles/Captions (CC)
- **Decorative Images:** `alt=""` oder `aria-hidden="true"`

### Forms
- **Labels:** Jedes Input braucht `<label>` mit `for` Attribut
- **Error Messages:** Mit `aria-describedby`, verknüpft mit Input
- **Required:** Nutze `required` Attribut, zeige visuell an (z.B. Asterisk)
- **Fieldset:** Nutze `<fieldset>` + `<legend>` für Gruppen

---

## Settings Menu (Standardized Struktur)

**Settings Menu:**
- Platzierung: Auf Höhe der Seitentitel (Überschrift), oben rechts
- Symbol: Drei vertikale Punkte (⋮) - Android-Standard
- Aria-Label: `aria-label="Settings"`

### Settings Menu Content - Reihenfolge

1. **Appearance Settings**
   - Theme Toggle: **Light, Dark, System** (3 Optionen)
   - Language Toggle: English, Deutsch
   - Plain Text Labels, kein Emoji

2. **App-spezifische Settings** (Optional)
   - z.B. Operation, Difficulty Mode
   - Separate Sections mit Separators

3. **User Account Management** (nur bei Auth vorhanden)
   - "Sign Out" / "Abmelden"-Button
   - Platzierung: Oberhalb von "Export" oder separate Section
   - Style: Primary color link oder destructive button

4. **Export / Data Management** (Optional)
   - Speichern in localStorage/AsyncStorage
   - Taste zum Export als Json-Daten

5. **Feedback, Support & About - Unified Row** ⭐
   - **KRITISCH:** Alle drei MÜSSEN in einer Zeile stehen
   - Gleich breite Buttons (flex: 1)
   - **Feedback Link:** `mailto:devsven@posteo.de?subject=AppName Feedback`
   - **Support Link:** `https://ko-fi.com/devsven`
   - **About Button:** Öffnet Modal-Popup
   - Plain Text, kein Emoji
   - Separator davor und danach

6. **About Modal Popup**
   - **Trigger:** "About" Button im Settings-Menü
   - **Header:** "About" Title mit Close Button (✕)
   - **Content:**
     - Version: "Version X.Y.Z"
     - wenn externe Daten: "Data Source: ..."
     - License: "App License: MIT", "Keine kommerzielle Nutzung ohne Genehmigung"
   - **Modal-Style:** Centered, Max 512px width, semi-transparent backdrop

### Design Token Spezifikation - Settings Menu (Material 3 Standard)

#### Buttons - Material 3 Style

**Theme Toggle Buttons (Outlined):**
- Style: Outlined Button, 3 gleich breite Buttons
- Border-Radius: `20px` (Material 3)
- Border: `2px solid`
- Active State: Filled mit Primary Color, Radius `20px`
- Padding: `8px vertical × 16px horizontal`
- Height: `40px` (Touch-friendly)

**Feedback/Support/About Buttons (Outlined):**
- Alle 3 in einer Zeile mit `flex: 1`
- Style: Outlined Button
- Border-Radius: `20px`
- Border: `2px solid`
- Padding: `8px vertical × 16px horizontal`
- Height: `40px` (Touch-friendly)

#### Colors (Theme-Aware)
```css
/* Light Mode */
--settings-bg: #FAFAFA
--settings-surface: #EFEFEF
--settings-text: #111827
--settings-text-secondary: #6b7280
--settings-border: #D0D0D0
--settings-primary: #667eea
--settings-button-outlined-border: #E0E0E0
--settings-button-outlined-text: #111827
--settings-button-active-bg: #667eea
--settings-button-active-text: #ffffff

/* Dark Mode */
--settings-bg-dark: #0A0A0A
--settings-surface-dark: #252525
--settings-text-dark: #f3f4f6
--settings-text-secondary-dark: #9ca3af
--settings-border-dark: #404040
--settings-button-outlined-border-dark: #404040
--settings-button-outlined-text-dark: #f3f4f6
```

#### Typography (Material 3)
```css
--settings-title-size: 18px
--settings-title-weight: 600
--settings-section-title-size: 12px
--settings-section-title-weight: 600
--settings-section-title-case: uppercase
--settings-button-text-size: 14px
--settings-button-text-weight: 500
```

#### Spacing (Material 3 8px Grid)
```css
--settings-modal-padding: 24px
--settings-section-padding: 16px
--settings-button-group-gap: 8px
--settings-item-spacing: 12px
--settings-separator-margin: 16px 0
```

#### Shadows (Soft & Modern)
```css
/* Outlined Buttons - no shadow */
/* Filled Buttons when active - Medium elevation */
shadowOpacity: 0.12;
shadowRadius: 16px;
elevation: 4;
```

### Verifikationscheckliste

- [ ] Header: 18px, 600 weight
- [ ] Close button: 44x44px touch target
- [ ] Section titles: 12px, uppercase
- [ ] Theme buttons: 3x flex width, 40px height
- [ ] Separators: 1px, no margin
- [ ] All interactive elements >= 44px
- [ ] Dark mode tested
- [ ] Hover states: opacity 0.8 or color change
- [ ] Focus indicators: 2px outline, 2px offset

### Store Compliance - Support Links

Support-Links im Settings-Menü sind Standard-Praxis und gelten NICHT als "In-App-Werbung":
- "Contains Ads": ❌ NO
- "In-App Purchases": ❌ NO
- Settings Menu ist Teil der App-Funktion, nicht Werbung

---

## Interaktion & Feedback

### Loading States
- **Spinner:** Rotierendes Icon oder Skeleton-Screen
- **Duration:** Max. 3 Sekunden ohne Feedback (dann Nachrichten zeigen)
- **Text:** "Loading...", "Saving...", etc.
- **Disable:** Buttons/Inputs während Loading disablen

### Success/Error Messages
- **Toast Notifications:** Kurz, 3-5 Sekunden sichtbar
- **Types:** Success (grün), Error (rot), Warning (gelb), Info (blau)
- **Position:** Oben rechts (Desktop), Oben Mitte (Mobile)
- **Icon:** Visual Indicator (✓, ✕, ⚠, ℹ)

### Animations
- **Duration:** 200-300ms für Hover/Focus, 300-500ms für Page Transitions
- **Easing:** `ease-out` für Erscheinen, `ease-in` für Verschwinden
- **Reduzieren:** `prefers-reduced-motion: reduce` respektieren
- **Keine flashing:** Nichts sollte schneller als 3x pro Sekunde blinken

### Hover & Focus States
- **Hover:** Farb-Change, Schatten, oder Scale (max 1.05)
- **Focus:** Visible Focus Ring (nicht outline: none!)
- **Active:** Gedrückter Effekt oder Farb-Change
- **Feedback Time:** < 100ms (sollte sofort responsive wirken)

---

## Internationalisierung (i18n)

### Automatische Spracherkennung (PFLICHT)

**KRITISCH:** Alle Apps MÜSSEN automatische Spracherkennung implementieren. Nutzer sollten ihre Sprache NICHT manuell wählen müssen.

#### Warum automatisch?
- **Bessere UX:** Nutzer sieht sofort die richtige Sprache beim ersten Start
- **Weniger Friction:** Keine manuelle Auswahl-Schritt
- **Erwartung:** Standard in modernen Apps (Google, Apple Apps, etc.)
- **Accessibility:** Nutzer mit Sehbehinderung können Settings oft nicht finden

#### Implementation-Standard
1. **Beim App-Start:** Erkenne Device/Browser Sprache automatisch
2. **Manual Override:** Biete Settings-Option für manuelle Sprachwahl
3. **Persistierung:** Speichere manuelle Auswahl in AsyncStorage/localStorage
4. **Fallback:** Nutze Englisch wenn Device-Sprache nicht unterstützt ist

#### Code-Beispiel (React Native/Expo)
```typescript
import * as Localization from 'expo-localization';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Language = 'en' | 'de';

const useLanguage = () => {
  const detectDeviceLanguage = (): Language => {
    const deviceLang = Localization.locale.split('-')[0]; // 'de-DE' -> 'de'
    return ['en', 'de'].includes(deviceLang) ? deviceLang as Language : 'en';
  };

  const [language, setLanguage] = useState<Language>(detectDeviceLanguage());

  // Load saved preference on mount
  useEffect(() => {
    AsyncStorage.getItem('language').then((saved) => {
      if (saved && ['en', 'de'].includes(saved)) {
        setLanguage(saved as Language);
      }
    });
  }, []);

  // Persist language changes
  const changeLanguage = (newLang: Language) => {
    setLanguage(newLang);
    AsyncStorage.setItem('language', newLang);
  };

  return { language, changeLanguage };
};
```

#### Code-Beispiel (Web)
```javascript
// utils/language.js
export const detectLanguage = () => {
  // 1. Check localStorage for saved preference
  const saved = localStorage.getItem('language');
  if (saved && ['en', 'de'].includes(saved)) {
    return saved;
  }

  // 2. Detect browser language
  const browserLang = navigator.language.split('-')[0]; // 'de-DE' -> 'de'
  return ['en', 'de'].includes(browserLang) ? browserLang : 'en';
};

export const setLanguage = (lang) => {
  localStorage.setItem('language', lang);
  window.location.reload(); // Re-render with new language
};
```

#### Settings UI Pattern
```tsx
// Settings Menu - Language Toggle (Material 3 Style)
<View style={styles.languageSection}>
  <Text style={styles.sectionTitle}>{t.language}</Text>
  <View style={styles.buttonGroup}>
    <TouchableOpacity
      style={[
        styles.languageButton,
        language === 'en' && styles.languageButtonActive
      ]}
      onPress={() => changeLanguage('en')}
    >
      <Text style={[
        styles.buttonText,
        language === 'en' && styles.buttonTextActive
      ]}>
        English
      </Text>
    </TouchableOpacity>

    <TouchableOpacity
      style={[
        styles.languageButton,
        language === 'de' && styles.languageButtonActive
      ]}
      onPress={() => changeLanguage('de')}
    >
      <Text style={[
        styles.buttonText,
        language === 'de' && styles.buttonTextActive
      ]}>
        Deutsch
      </Text>
    </TouchableOpacity>
  </View>
</View>
```

#### Best Practices
- ✅ **Automatisch beim ersten Start** - Nutze Device/Browser Sprache
- ✅ **Manual Override möglich** - Settings-Option für manuelle Wahl
- ✅ **Persistierung** - Speichere Änderungen dauerhaft
- ✅ **Text-Labels** - "English", "Deutsch" (keine Flaggen!)
- ✅ **Fallback** - Englisch als Default wenn Sprache nicht unterstützt
- ✅ **Reload/Rerender** - UI aktualisiert sich nach Sprachwechsel

#### Anti-Patterns
- ❌ **Manuelle Sprachwahl beim ersten Start** - Friction für Nutzer
- ❌ **Keine Persistierung** - Nutzer muss bei jedem Start neu wählen
- ❌ **Flaggen als Sprach-Symbole** - Politisch problematisch (EN ≠ UK/US)
- ❌ **Hartcodierte Sprache** - App immer auf Englisch
- ❌ **Keine automatische Erkennung** - Nutzer erwartet moderne UX

#### Checkliste
- [ ] Automatische Spracherkennung beim App-Start implementiert
- [ ] Manual Override in Settings verfügbar
- [ ] Sprach-Präferenz wird persistiert (AsyncStorage/localStorage)
- [ ] Fallback zu Englisch definiert
- [ ] Text-Labels statt Flaggen
- [ ] Alle UI-Texte übersetzt (keine hartcodierten Strings)
- [ ] UI aktualisiert sich nach Sprachwechsel

---

### Mehrsprachigkeit

#### Struktur
- **Übersetze nur User-facing Text:** Technische Labels können Englisch bleiben
- **Format:** JSON oder YAML mit Namespace (z.B. `common.greeting`)
- **Default Language:** Englisch (internationale Reichweite)
- **RTL Support:** Bedenke RTL Languages (z.B. Arabisch) für zukünftige Unterstützung

#### Translation Files Organisation
```
/translations
  ├── en.json    # English (Default)
  ├── de.json    # German
  └── fr.json    # French (Optional)
```

**Beispiel translations/en.json:**
```json
{
  "common": {
    "settings": "Settings",
    "about": "About",
    "language": "Language"
  },
  "buttons": {
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete"
  },
  "settings": {
    "theme": "Theme",
    "themeLight": "Light",
    "themeDark": "Dark",
    "themeSystem": "System"
  }
}
```

#### Text Handling
- **Keying:** Nutze prägnante Keys, z.B. `button.save` statt `text1`
- **Variablen:** Nutze Placeholders für dynamische Werte: `Hello, {name}!`
- **Plural Forms:** Handle Singular/Plural (z.B. "1 message" vs "5 messages")
- **Dates/Numbers:** Nutze Locale-aware Formatierung
  ```typescript
  // Locale-aware Date
  new Date().toLocaleDateString(language === 'de' ? 'de-DE' : 'en-US');

  // Locale-aware Number
  (123456.78).toLocaleString(language === 'de' ? 'de-DE' : 'en-US');
  ```

#### Ausnahmen (darf hartcodiert bleiben)
- ✅ **App-Name** (z.B. "Energy Price Germany")
- ✅ **Technische Bezeichnungen** (z.B. "GitHub", "API", "JSON")
- ✅ **Versionsnummern** (z.B. "1.2.0")
- ✅ **URLs und E-Mail-Adressen**
- ✅ **Emojis** (universell verständlich, aber sparsam nutzen)

---

## Offline Indicators (für PWAs)

### Connection Status
- **Indicator:** Kleine Icon/Badge mit Status (online/offline)
- **Position:** Top-right oder Top-bar
- **Farben:** Grün (online), Grau (offline)
- **Message:** "You are offline - some features may be limited"
- **Auto-sync:** Zeige Status wenn Daten synched werden

---

## Empty States

- **Icon:** Relevantes Icon (z.B. leerer Ordner, keine Daten)
- **Title:** Kurz, z.B. "No tasks yet"
- **Description:** Eine Zeile, was der User tun kann
- **CTA:** Ein Primary Button für nächste Aktion (z.B. "Create first task")

---

## Performance Indicators

### Lighthouse Audit Targets
- **Performance:** 80+ (PWA), 90+ (andere Projekte)
- **Accessibility:** 90+
- **Best Practices:** 90+
- **SEO:** 90+

---

## Emoji-Richtlinien

**Wo emojis OK sind:**
- ✅ Settings Button selbst (⋮ für Menü-Icon)
- ✅ Dekoration/Branding in Dokumentation
- ✅ Fehlerberichte & Commit-Messages (für Entwickler)
- ✅ Loading/Success Messages (als Icon, nicht als Text)

**Wo emojis NICHT verwendet werden:**
- ❌ Navigations-Labels (statt 📅 "Calendar", statt 📋 "Agenda")
- ❌ Button-Labels (statt "🔁 Refresh" → "Refresh")
- ❌ Settings Menu Items (statt "📧 Feedback" → "Send Feedback")
- ❌ Menü-Einträge und Links
- ❌ Überschriften und Titel

**Rationale:**
- Emojis sind inkonsistent über Plattformen
- Schlechter Support auf älteren Geräten/Browsern
- Accessibility: Screen Reader lesen Emoji-Namen
- Professionelleres Erscheinungsbild

---

## Checkliste für neues Projekt

### Allgemein (Web & Mobile)
- [ ] Color Palette definiert (min. 5 Farben)
- [ ] Typography definiert (max. 2 Fonts)
- [ ] Spacing System definiert (8px Grid)
- [ ] Responsive Breakpoints definiert
- [ ] Dark Mode unterstützt (CSS Variables)
- [ ] Accessibility Checklist durchgegangen
- [ ] Keyboard Navigation getestet
- [ ] Screen Reader kompatibel
- [ ] Focus Rings sichtbar
- [ ] Touch Targets >= 44px × 44px
- [ ] Loading States implementiert
- [ ] Error States implementiert
- [ ] Empty States implementiert
- [ ] Lighthouse Audit >= 80 Points
- [ ] Settings Menu mit Feedback/Support/About Struktur
- [ ] Store Compliance überprüft

---

## Komponenten Standards - UI Components Katalog

> Diese Sektion wurde konsolidiert aus [design-system.md](design-system.md). Siehe dortige Datei für detaillierte Code-Beispiele.

### Button

#### Material 3 Design Standard

**Filled Buttons** (Primäre Aktionen):
- Vollständiger Background-Fill mit Theme Color
- Border-Radius: `28px`
- Für primäre CTAs: Check, Next, Submit, Create
- Elevation/Schatten: Medium (shadowOpacity: 0.12, shadowRadius: 16)
- Padding: 8px (vertikal) × 16px (horizontal)

**Outlined Buttons** (Sekundäre Aktionen):
- Transparent Background, `2px solid` Border
- Border-Radius: `20px`
- Für wiederholte/sekundäre Aktionen: Numpad, Toggles, Settings, Multiple Choice
- Border Color: Theme-aware (`colors.border`, `colors.textSecondary`)
- Keine Elevation/Schatten
- Padding: 8px (vertikal) × 16px (horizontal)

**Danger Button:**
- Rot (#ef4444), für destruktive Aktionen (Delete, Remove)
- Filled Style mit rotem Background

#### Größen
- **Small:** 32px Height
- **Medium:** 40px Height (Standard)
- **Large:** 48px Height
- **Minimum Touch Target:** 44px × 44px (WCAG)

#### States & Verhalten
- **Default:** Normale Zustand
- **Hover:** Dunklere Variante oder Schatten
- **Active:** Gedrückter Effekt
- **Disabled:** 50% Opacity, cursor: not-allowed
- **Loading:** Spinner + "Loading..." Text

#### Mit Icons
- Icon nur: Muss `aria-label` haben
- Icon + Text: Icon links, Text rechts mit 8px Gap
- Min. height: 40px

#### Implementierung (React Native/Expo)
```tsx
// Outlined Button mit Theme-Aware Styles
<NumpadButton
  colors={colors}
  style={[
    styles.numpadButton,
    {
      borderColor: colors.border,
      backgroundColor: 'transparent',
      borderWidth: 2,
      borderRadius: 20,
    }
  ]}
/>

// Filled Button
<PrimaryButton
  style={{
    backgroundColor: colors.primary,
    borderRadius: 28,
    elevation: 4,
  }}
/>
```

### Input / Form Elements

#### Text Input, Textarea, Select, Checkbox, Radio
- **Größe:** 40-44px Height (Touch-friendly)
- **Padding:** 8-12px
- **Border:** 1px solid, 4-6px border-radius
- **Focus State:** Visible Focus Ring (min. 2px, 2px offset)
- **Label:** Immer vorhanden, über Input, `for` Attribut verknüpft
- **Error State:** Rote Border + Error Message unter Input
- **Disabled State:** 50% Opacity, cursor: not-allowed

#### Best Practices
- Labels müssen `for` Attribut haben (für Screen Reader)
- Error Messages mit `aria-describedby` verknüpfen
- Required Fields mit `required` Attribut + visueller Indikator (*)
- Fieldset + Legend für Gruppen (Radio, Checkbox)

### Card

- **Padding:** 16px - 24px
- **Border:** 1px solid (#e5e7eb) oder Box-Shadow
- **Border-Radius:** 8px - 12px
- **Spacing:** 16px - 24px zwischen Cards
- **Varianten:** Mit Image, Header, Footer, nur Body
- **Shadow (Soft & Modern):**
  - Small: opacity 0.08, radius 8px
  - Medium: opacity 0.12, radius 16px
  - Large: opacity 0.18, radius 24px

### Modal / Dialog

- **Width:** 90vw max 512px (mobile), 600px (desktop)
- **Padding:** 24px - 32px
- **Header:** Bold, 18px - 20px Font
- **Close Button:** X Icon, top-right, 44px × 44px minimum
- **Backdrop:** Dunkelgrau mit 70% Opacity
- **Animation:** Fade-in (200ms), Slide-up (300ms)
- **Accessibility:**
  - Focus trap (Tab-Navigation bleibt im Modal)
  - Escape schließt Modal
  - role="dialog" mit aria-labelledby

### Tabs

- **Header:** Flexbox, Border-bottom
- **Tab Button:** 44px+ height, Keyboard Navigation (Arrow Keys)
- **Active State:** Highlight + Border-bottom
- **Content:** role="tabpanel" mit aria-labelledby

### Alert / Toast Notifications

- **Position:** Top-right (Desktop), Top-Center (Mobile)
- **Width:** Max 400px
- **Types:** Success (grün), Error (rot), Warning (gelb), Info (blau)
- **Duration:** 3-5 Sekunden sichtbar, Auto-dismiss oder Close-Button
- **Icon:** Visual Indicator (✓, ✕, ⚠, ℹ)
- **Animation:** Slide-in from right (300ms)

### Spinner / Loading

- **Size:** 20-24px (Standard), skalierbar
- **Animation:** Rotation 600ms linear infinite
- **Color:** Primary color
- **Usage:** In Buttons, als Page Spinner, oder Skeleton Screen
- **Text:** "Loading..." oder "Saving..." daneben

### Badge

- **Padding:** 4px 12px (0.25rem 0.75rem)
- **Border-Radius:** 9999px (vollständig rund)
- **Font-Size:** 12px (0.75rem)
- **Font-Weight:** 600
- **Variants:** Primary, Success, Warning, Danger
- **Usage:** Status-Indikator, Kategorien, neue Features

### Komponenten Checkliste

- [ ] Semantisches HTML (button, form, dialog, etc.)
- [ ] Keyboard Navigation (Tab, Enter, Escape, Arrow Keys)
- [ ] Focus Styles sichtbar (2px outline, 2px offset)
- [ ] ARIA Labels wo nötig
- [ ] Loading States
- [ ] Disabled States
- [ ] Error States mit Meldungen
- [ ] Touch-freundliche Größen (min. 44px)
- [ ] Mobile & Desktop responsive
- [ ] Dark Mode kompatibel
- [ ] Dokumentiert mit Code-Beispielen

---

## Store Compliance & Design Guidelines

> Diese Sektion wurde konsolidiert aus [DESIGN_GUIDELINES.md](DESIGN_GUIDELINES.md)

### Support-Link Platzierung

**✅ EMPFOHLEN: Settings/About-Menü Integration**
- Support-Link gehört im Settings/About-Menü, nicht im Footer
- NICHT als "In-App-Werbung" interpretierbar (Professional Standard)
- Vergleichbar mit GitHub Sponsors, Patreon in Open Source Apps
- Explizit freiwillig, nicht aufdringlich

**❌ NICHT ERLAUBT: Footer mit direktem Support-Link**
- Zu prominent, könnte als Werbung interpretiert werden
- Play Store könnte "Contains Ads" fälschlicherweise ankreuzen müssen

### Standardisierte Settings/About-Menü Struktur

```
⚙️ Settings / About

📊 App Settings
  ├─ 🌓 Theme (Light/Dark/System)
  ├─ 📱 Language
  └─ 🔔 Notifications (falls relevant)

ℹ️ About
  ├─ 📱 Version X.Y.Z
  ├─ 📜 Privacy Policy
  ├─ 📄 Open Source License (MIT)
  └─ 🔗 GitHub Repository

💝 Support
  ├─ 💝 Support the Project / Support Development
  ├─ 📤 Share this App
  ├─ ⭐ Rate on Play Store/App Store
  └─ 🐛 Report a Bug (GitHub Issues)
```

**Text-Formulierung:**
- ✅ "Support the Project" / "Support Development"
- ✅ "Buy Me a Coffee ☕"
- ❌ NICHT: "Support me" (zu persönlich)
- ❌ NICHT: "Donate" (klingt wie Charity)
- ❌ NICHT: "Premium" (klingt wie In-App Purchase)

### Store Compliance - Ads Angabe

**Google Play Store & Apple App Store:**
```
"Contains Ads": ❌ NO - App enthält keine Werbung
```

**Begründung:**
- Support-Link im Settings-Menü = KEINE Werbung
- Keine Ad-SDKs (AdMob, Facebook Ads, etc.)
- Keine Tracking-Cookies für Monetarisierung
- Freiwillige Unterstützung ≠ Werbung

**Data Safety (Google Play):**
- Ad SDK Usage: None
- Third-party advertising: No
- Personal data collected for advertising: No

### Internationalisierung (i18n) - Kein hartcodierter Text

**REGEL: Alle sichtbaren Texte MÜSSEN über das Übersetzungssystem laufen.**

#### ❌ NICHT erlaubt
```tsx
<Text>Settings</Text>
<Text>Open Source • MIT</Text>
```

#### ✅ EMPFOHLEN
```tsx
<Text>{t.settings}</Text>
<Text>{t.appLicense}</Text>
```

#### Ausnahmen (darf hartcodiert bleiben)
- ✅ **App-Name** (z.B. "Energy Price Germany")
- ✅ **Technische Bezeichnungen** (z.B. "Energy Charts", "API", "GitHub")
- ✅ **Versionsnummern** (z.B. "1.2.0")
- ✅ **URLs und E-Mail-Adressen**
- ✅ **Emojis** (universell verständlich)

#### Translations-Struktur
```tsx
const translations = {
  en: {
    settings: 'Settings',
    appLicense: 'Open Source • MIT',
    // ... weitere englische Texte
  },
  de: {
    settings: 'Einstellungen',
    appLicense: 'Open Source • MIT',
    // ... weitere deutsche Texte
  },
};
```

### Viralität & Growth: Share-Button Standard

**REGEL: Jede App sollte einen Share-Button im Settings-Menü haben.**

#### ✅ Standardimplementierung (React Native/Expo)

```tsx
import { Share, Platform } from 'react-native';

const shareApp = async () => {
  try {
    const appName = 'Energy Price Germany'; // App-spezifisch
    const benefit = 'Spare Geld mit Echtzeit-Strompreisen!'; // App-spezifisch
    const storeUrl = Platform.select({
      ios: 'https://apps.apple.com/app/...',
      android: 'https://play.google.com/store/apps/details?id=...',
      web: window.location.origin,
    });

    const result = await Share.share({
      message: `🚀 ${appName} - ${benefit}\n\n⬇️ Kostenloser Download:\n${storeUrl}?utm_source=share&utm_medium=app`,
      title: `Empfehlung: ${appName}`,
    });

    if (result.action === Share.sharedAction) {
      console.log('App shared successfully');
    }
  } catch (error) {
    console.error('Error sharing app:', error);
  }
};
```

#### Settings-Menü Integration
```tsx
// Im Settings/About-Menü unter "SUPPORT" platzieren:
<TouchableOpacity onPress={shareApp} style={styles.menuLink}>
  <Text style={[styles.legendText, { color: colors.primary }]}>
    {t.shareApp}
  </Text>
</TouchableOpacity>
```

#### UTM-Parameter für Tracking
```
?utm_source=share&utm_medium=app&utm_campaign=organic
```

**Tracking-Tools (Privacy-konform):**
- ✅ Plausible Analytics (DSGVO-konform, kein Cookie-Banner)
- ✅ Google Analytics (mit Consent-Banner)
- ❌ Keine personenbezogenen Daten tracken

#### App-spezifische Share-Texte

**Energy Price Germany:**
```
"🚀 Energy Price Germany - Spare Geld mit Echtzeit-Strompreisen!

⬇️ Kostenloser Download:
[Store-Link]?utm_source=share&utm_medium=app"
```

**Best Practices:**
1. ✅ Share-Button nicht zu prominent (wirkt nicht verzweifelt)
2. ✅ In Settings unter "Support" platzieren
3. ✅ Kurzer, prägnanter Share-Text (max. 2-3 Zeilen + Link)
4. ✅ UTM-Parameter für Tracking
5. ✅ Emoji nutzen (fallen auf, aber sparsam)
6. ❌ NICHT nach jeder App-Nutzung zum Teilen auffordern
7. ❌ NICHT mit Belohnungen incentivieren (Play Store Policy)

---

## Plattform-spezifische Implementierungen

### Android Edge-to-Edge (Android 15+)

> Detaillierte Android UX Guidelines: [ANDROID-UX-GUIDELINES.md](ANDROID-UX-GUIDELINES.md)

**Kritische Anforderungen:**
- **enableEdgeToEdge()** in MainActivity (empfohlen)
- **Material Components** >= 1.13.0
- **compileSdk/targetSdk:** 36+
- **themes.xml:** Transparente System Bars
- Separate Dark Mode Themes

### Web (React Native Web / Standard Web)

- Responsive Breakpoints: 320px, 768px, 1024px, 1280px, 1536px
- CSS Variables für Theme-Wechsel
- Media Queries für Dark Mode: `prefers-color-scheme`
- Hover-States mit `@media (hover: hover)`

---

## Referenzen

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Material Design 3](https://m3.material.io/)
- [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [Web Content Accessibility Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Android Edge-to-Edge Documentation](https://developer.android.com/develop/ui/views/layout/edge-to-edge)
- **Related Template Files:**
  - [design-system.md](design-system.md) - Komponenten-Katalog (detaillierte Code-Beispiele)
  - [DESIGN_GUIDELINES.md](DESIGN_GUIDELINES.md) - Store Compliance & i18n (Archiviert)
  - [ANDROID-UX-GUIDELINES.md](ANDROID-UX-GUIDELINES.md) - Android 15+ Best Practices
  - [accessibility-guidelines.md](accessibility-guidelines.md) - ⚠️ DEPRECATED (siehe Barrierefreiheit oben)
