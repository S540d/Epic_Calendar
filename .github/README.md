---
https://s540d.github.io/Epic_Calendar/

# GitHub Templates & Configuration

Zentrale Vorlagen für Issue und Pull Request Templates.

---

## Struktur

```
.github/
├── ISSUE_TEMPLATE/
│   ├── bug.md              # Bug Reports
│   ├── feature.md          # Feature Requests
│   ├── documentation.md    # Documentation Requests
│   └── question.md         # Questions / Discussions
│
├── PULL_REQUEST_TEMPLATE/
│   └── default.md          # Standard PR Template
│
└── README.md               # Diese Datei
```

---

## Issue Templates

### 🐛 Bug Report (`bug.md`)

Für Fehler und Probleme. Enthält:

- Schritte zum Reproduzieren
- Erwartet vs. Beobachtet Verhalten
- Environment (Browser, OS, Version)
- Screenshots / Console Errors

**Nutze, wenn:**

- Etwas funktioniert nicht wie erwartet
- Es Fehler gibt oder Crashes
- Behaviour ist falsch

### ✨ Feature Request (`feature.md`)

Für neue Features und Verbesserungen. Enthält:

- Beschreibung und Nutzen
- Anforderungen und Akzeptanzkriterien
- Implementierungshinweise
- Priorität und Aufwand-Schätzung

**Nutze, wenn:**

- Du ein neues Feature vorschlägst
- Du eine Verbesserung vornehmen möchtest
- Du etwas hinzufügen willst

### 📚 Documentation Request (`documentation.md`)

Für fehlende oder verwirrende Dokumentation. Enthält:

- Beschreibung des Problems
- Betroffene Bereiche
- Vorschlag für Verbesserung

**Nutze, wenn:**

- Dokumentation ist unvollständig
- Etwas ist verwirrend erklärt
- Hinweise fehlen

### ❓ Question / Discussion (`question.md`)

Für Fragen und Diskussionen. Enthält:

- Frage / Diskussions-Thema
- Kontext
- Eigene Recherche

**Nutze, wenn:**

- Du eine Frage hast
- Du Ratschläge möchtest
- Du etwas diskutieren willst

---

## Pull Request Template

### Default (`default.md`)

Standard PR Template für alle Pull Requests. Enthält:

**Sections:**

- 📋 Beschreibung (Was macht der PR?)
- 🔄 Änderungen (Liste der Änderungen)
- 🧪 Testing (Was wurde getestet?)
- 🔒 Security (Sicherheits-Checks)
- 📚 Dokumentation (Docs aktualisiert?)
- 📸 Screenshots (Für UI Änderungen)
- ✅ Checkliste (Vor dem Merge)
- 🚀 Deployment (Spezielle Schritte?)
- 📌 Type (Bug Fix, Feature, etc.)

**Automatisch genutzt für:**

- Alle neuen Pull Requests
- Suggiert Structure & Checklisten
- Verhindert vergessene Checks

---

## Verwendung in Projekten

### Option 1: Kopieren (Einfach)

```bash
# Kopiere die .github Verzeichnisse ins Projekt
cp -r .templates/.github .
```

### Option 2: Symlink (Aktualisierbar)

```bash
# Erstelle Symlinks (nur auf macOS/Linux)
ln -s .templates/.github/ISSUE_TEMPLATE .github/ISSUE_TEMPLATE
ln -s .templates/.github/PULL_REQUEST_TEMPLATE .github/PULL_REQUEST_TEMPLATE
```

### Option 3: Manuelle Anpassung (Empfohlen)

Die Templates als Basis verwenden und projekt-spezifisch anpassen:

```bash
# Kopiere Templates
cp -r .templates/.github .

# Bearbeite für dein Projekt
# z.B. Entferne PWA-spezifische Checks
# Füge eigene Checklisten hinzu
```

---

## Best Practices

### Issue Templates

✅ **DO:**

- Aussagekräftige Titel nutzen
- Template-Struktur befolgen
- Checklisten ausfüllen

❌ **DON'T:**

- Templates ignorieren
- Vague Beschreibungen
- Keine Kontext-Informationen

### PR Templates

✅ **DO:**

- Alle Checkboxen vor dem Merge abhaken
- Aussagekräftige Commit Messages
- Testing dokumentieren

❌ **DON'T:**

- Ungetestete PRs pushen
- Checklisten ignorieren
- Keine Beschreibung

---

## Anpassung pro Projekt

Templates können projekt-spezifisch angepasst werden:

```markdown
## Beispiel: PWA spezifische Checks

Im PR Template kannst du hinzufügen:

### 📱 PWA Checks

- [ ] Service Worker funktioniert
- [ ] Offline Mode getestet
- [ ] Manifest aktualisiert
```

---

## Integration mit GitHub

### Automatische Vorschläge

GitHub schlägt automatisch die Templates vor, wenn:

1. Benutzer neue Issue erstellt
2. Benutzer neuen PR erstellt
3. Templates im `.github/ISSUE_TEMPLATE` oder `.github/PULL_REQUEST_TEMPLATE` sind

### Branch Protection

Combine mit Branch Protection Rules:

- Mindestens 1 Approval erforderlich
- Conversations müssen resolved sein
- Status Checks müssen grün sein

---

## Ressourcen

- [GitHub Issue Templates Docs](https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests)
- [GitHub PR Templates Docs](https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/creating-a-pull-request-template-for-your-repository)

---
