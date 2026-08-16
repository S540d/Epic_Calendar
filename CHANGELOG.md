# Changelog

## [Unreleased]

### Added

- **Lernreisen – geführter Kindermodus (#171-Folge):** Neue kuratierte, lineare Touren durch den Zeitstrahl. Die Startseite listet drei Reisen („Die große Reise" vom Urknall bis zum WWW, 17 Stationen · „Berühmte Geschichten" durch die Anekdoten, 11 Stationen · „Erfindungen, die alles verändert haben", 13 Stationen). Ein Tipp startet die Reise: der Zeitstrahl zoomt auf die jeweilige Station, und eine Leiste am unteren Rand zeigt Fortschritt, Titel, Jahr, Beschreibung sowie `story`/`mnemonic` mit Zurück/Weiter-Navigation. Kategorie und Kontinent der Station werden automatisch aktiviert, damit das Ziel unter den aktuellen Filtern sichtbar ist. Der Stand wird pro Reise persistiert (`learningJourneyProgress`), sodass die Startseite „Fortsetzen · Station X von Y" anbietet; das Abschließen der letzten Station setzt die Reise zurück. Eine Reise ist bewusst nur eine geordnete Liste vorhandener Event-IDs (`src/data/learningJourneys.ts`) — die Stationstexte kommen aus den Events selbst und können nicht auseinanderlaufen.
- **Bekannte Geschichten für den Kindermodus (`story`, #171-Folge):** Neues optionales Schema-Feld `story?: string` neben `mnemonic` — für kurz nacherzählte Anekdoten statt Jahres-Merksprüchen. Wird im `EventDetailModal` in einer eigenen Box angezeigt, unabhängig von `mnemonic`. 10 Einträge über 4 Kategorien und 4 Kontinente + global: Archimedes' „Störe meine Kreise nicht!" (neues Event `archimedes-tod`, natur), Newtons Apfel (`newton-principia`, natur), Galileis „Und sie bewegt sich doch" (neues Event `galileo-inquisition`, natur), Franklins Drachenexperiment (neues Event `franklin-blitzableiter`, natur), Marie Curies strahlende Notizbücher (`curie-radioaktivitaet`, natur), Buddhas Erwachen unter dem Bodhi-Baum (`as-buddha`, herrscher/Asien), Dschingis Khans Pfeilbündel (`as-dschingis-khan`, herrscher/Asien), Kleopatras Tod durch die Schlange (`af-kleopatra-vii`, herrscher/Afrika), Alexanders Gordischer Knoten (`eu-herr-alexander`, herrscher/Europa), Diogenes' „Geh mir aus der Sonne" (neues Event `eu-herr-diogenes`, herrscher/Europa) sowie Caesars „Auch du, Brutus?" (neues Event `eu-caesar-ermordung`, zivilisation/Europa).
- **Kultur-/Länder-Filter innerhalb eines Kontinents (#163):** Erneutes Antippen des bereits aktiven Kontinent-Tabs öffnet ein neues `CultureFilterModal` mit allen `culture`-Werten (Völker/Reiche) dieses Kontinents. Auswahl filtert den Zeitstrahl auf diese Kultur; „Alle anzeigen" setzt zurück. Der aktive Filter ist unmissverständlich sichtbar: Punkt-Indikator auf dem Kontinent-Tab plus Banner-Zeile über dem Zeitstrahl („Gefiltert: Römisch · zum Zurücksetzen tippen"). Der Filter wird pro Kontinent zurückgesetzt, da Kulturen kontinentgebunden sind (Kontinentwechsel oder Such-Sprung löschen ihn). `culture` ist als optionaler Parameter durch `eventIndex.ts`/`culling.ts`/`TimelineView` gefädelt, analog zum bestehenden `continent`-Filter.
- **Weitere Lernsprüche (#171):** 6 neue `mnemonic`-Einträge zu bekannten Wendepunkten in `europa.json` (Caesar/Rubikon „Alea iacta est", Varusschlacht „Varus, gib mir meine Legionen wieder!", Luthers Thesenanschlag 1517, Thermopylen-Epitaph, Marathon-Läufer, Sturm auf die Bastille 1789) — alle auf bereits vorhandenen `importance: 'core'`-Events, sichtbar im `EventDetailModal`.

- **Griechische Philosophen mit Einflusslinien:** 11 neue `herrscher`-Events in `europa.json`, aufgeteilt in zwei über `lineageId` verbundene Verbindungslinien-Gruppen. `vorsokratiker` (Thales von Milet, Pythagoras, Heraklit, Parmenides) zeigt die Wurzeln der Naturphilosophie vor dem ethischen Umbruch. `griechische-philosophie` (Sokrates, Demokrit, Platon, Aristoteles, Pyrrhon von Elis, Epikur, Zenon von Kition) zeigt die klassische und hellenistische Phase mit ihren wechselseitigen Bezügen (Sokrates → Platon als Lehrer-Schüler-Kette; Demokrits Atomismus als Grundlage für Epikurs Physik; Aristoteles kritisiert Platons Ideenlehre; Pyrrhon und Epikur setzen sich kritisch von Platon bzw. Aristoteles ab; Zenons Stoa übernimmt Logos-Konzept und Tugendideal aus der platonischen Tradition). Daten und Einflussbeziehungen orientieren sich am bereits ausgearbeiteten Denkschulen-Graphen in [s540d/philosophen](https://github.com/s540d/philosophen).

- **Kategorie „Kultur & Kunst" über Europa hinaus ausgebaut (Content-Coverage-Gap):** `kultur` hatte laut `npm run coverage`-Report bislang ausschließlich 8 Events in Europa, 0 auf allen anderen Kontinenten. 10 neue Events bringen die Kategorie erstmals auf 5 Kontinente: Asien +3 (Ukiyo-e/japanische Holzschnittkunst, Persische Miniaturmalerei der Herat-/Safawidenschule, Mogulmalerei), Amerika +3 (Mexikanischer Muralismus, Harlem Renaissance, Lateinamerikanischer Boom), Afrika +2 (Négritude-Bewegung, Afrobeat/Fela Kuti), Ozeanien +2 (Papunya-Tula-Punktmalerei, Hawaiianische Kulturrenaissance). `kultur` wächst von 8 auf 18 Events; nur `global` bleibt bewusst leer, da die Kategorie inhärent an Kontinente/Kulturkreise gebunden ist.
- **Detailstufe „Alles" (`detail`) für herrscher/natur/erdzeitalter/kultur nachgezogen (Content-Coverage-Gap):** Der `npm run coverage`-Report zeigte die Spezialisten-Tiefe fast ausschließlich in `zivilisation`/`nation`, während `herrscher`, `natur`, `erdzeitalter` und `kultur` bei 0 `detail`-Events lagen. Statt neuer Fakten wurden 9 bereits vorhandene, genuin spezialisierte Events auf `importance: 'detail'` hochgestuft (keine neuen Recherche-Risiken): Herrscher (Pharao Pianchi/Piye, Tullus Hostilius, Harald Hardrada), Natur (Eratosthenes' Erdumfangsmessung, Avicennas Medizin-Kanon), Erdzeitalter (Sudbury-Impakt, Tunguska-Ereignis), Kultur (Weimarer Klassik, Biedermeier).
- **Herrscher-Kategorie außerhalb Europa/Asien ausgebaut (Content-Coverage-Gap):** Der neue `npm run coverage`-Report zeigte ein starkes Ungleichgewicht bei `herrscher` (Ozeanien 2, Amerika 5, Afrika 8 vs. Europa 85). 9 neue Events ergänzen bislang fehlende Herrscher-Persönlichkeiten: Afrika +3 (Sundiata Keita – Gründer des Mali-Reiches, Königin Nzinga von Ndongo/Matamba, Haile Selassie I.), Amerika +3 (Moctezuma II., Toussaint Louverture, Tecumseh), Ozeanien +3 (Kamehameha I., George Tupou I. von Tonga, Cakobau von Fidschi). `herrscher` wächst dadurch von 116 auf 125 Events; Ozeanien/Amerika/Afrika verlassen den Bereich reiner Kolonial-/Entdecker-Perspektive (bisher u. a. nur Magellan/Cook für Ozeanien).
- **Dev-Tool: Content-Coverage-Report (`npm run coverage`):** Neues Script `scripts/coverage.js` zeigt, wie gut jede Kategorie pro Kontinent und pro Detailgrad (Kinder/Standard/Alles) mit Events gefüllt ist — als Tabelle in der Konsole, leere Kombinationen markiert mit „·". Reines Autoring-Werkzeug ohne App-UI, da die Frage „wo haben wir noch Lücken?" ein Content-Pflege-Anliegen ist, kein Nutzer-Feature.
- **Detailgrad-Hinweis beim ersten App-Start:** Zentraler, einmaliger Dialog auf der Startseite fragt neue Nutzer:innen nach dem gewünschten Detailgrad und verweist auf die Einstellungen (`DetailLevelPrompt`, persistiert als `detailLevelPromptSeen`). Der Dialog wählt den Detailgrad nicht selbst — „Zu den Einstellungen" öffnet direkt das bestehende `SettingsModal`, „Später" blendet den Hinweis dauerhaft aus.

### Changed

- **Nachvollziehbare Farblogik für Spuren-Farben (#162):** Die 6 Kategorie-Paletten (je 7 Hex-Werte für die Kultur-Einfärbung) waren bisher handgepflegte Arrays ohne erkennbare Systematik. `generatePalette()` leitet jede Palette jetzt deterministisch aus der Kategorie-Akzentfarbe her (HSL, feste Hue-/Lightness-Schritte im Zickzack um den Basiswert) — Index 0 ist immer die Akzentfarbe selbst. Optische Wirkung minimal, aber jede Spuren-Farbe ist jetzt aus ihrer Kategoriefarbe herleitbar statt frei gewählt.
- **Zoom-Buttons (⌖/+/−) bleiben immer sichtbar:** Sie lagen bisher als Teil des scrollbaren Zeitstrahl-Inhalts vor und rutschten bei vielen aktiven Lanes unten aus dem Bildschirm, sobald man in der `ScrollView` nach unten scrollte. `TimelineZoomCluster` wird jetzt in `TimelineScreen` außerhalb der `ScrollView` als fixes Overlay gerendert; `TimelineView` stellt die Zoom-Kommandos dafür über ein `forwardRef`/`useImperativeHandle`-Handle (`TimelineViewHandle`) bereit.

- **Doppelten Renderer-Code in gemeinsame Komponenten gezogen:** Web- und Native-Renderer enthielten den kompletten Chrome-Stack (Achsenzeile inkl. FPS-Overlay, Minimap, Epochenband, Breadcrumb), die Lane-Label-Spalte und den Zoom-Button-Cluster **zeichengleich doppelt** — jede Änderung daran musste in zwei ~400-Zeilen-Dateien parallel gemacht werden, abgesichert nur durch den Type-Check. Neu als `TimelineChrome`, `TimelineLaneLabels` und `TimelineZoomCluster`; in den Renderern bleibt nur, was echt divergiert (Skia-Canvas vs. RN-Views, nativer Multi-Hit-Popover, Web-Scroll-Wrapper und Mausrad-Shim). Rein interner Umbau ohne sichtbare Änderung. Nebenbei entfernt: ein `Platform.select` am Zoom-Cluster, das exakt die drei Positionswerte setzte, die `styles.zoomButtons` ohnehin schon hatte, sowie vier tote Imports.
- **Orientierung nach der Startseite vereinfacht:** Der Zeitstrahl zeigte bislang **fünf konkurrierende Sprung-Mechanismen** gleichzeitig (Minimap, Epochenband, Epochen-Chipleiste, Vor-/Zurück-Pfeile, Zoom-Cluster), dazu zwei Status-Pillen, zwei Home-Buttons und zwei Filterleisten — rund zehn Bedienstreifen um den Canvas, von denen keiner die eigentliche Frage „In welcher Epoche bin ich gerade?" beantwortete. Neu gibt es **ein** primäres Orientierungselement: die `EpochBreadcrumbBar` zeigt Zoomstufe, den Epochenpfad („Menschheit › Antike › Hellenismus") und den sichtbaren Zeitraum in einer Zeile; jeder Pfad-Eintrag ist antippbar und zoomt auf diese Ebene zurück. Damit entfallen `EpochChipBar`, `EpochNavArrows`, `TimelineBreadcrumb` und `ZoomLevelIndicator` ersatzlos, ebenso der doppelte ⌂-Button im Header (der Titel bleibt Home-Control).
- **Epochenband verfeinert sich beim Zoomen:** Das farbige Band unter der Zeitachse zeigte immer dieselben 10 festen Segmente. Es rendert jetzt die tiefste Baumebene, deren Segmente noch lesbar breit sind (`epochBandDepth`) — beim Hineinzoomen unterteilt sich „Menschheitsgeschichte" selbständig in Steinzeit/Antike/Mittelalter/Neuzeit und weiter in Früh-/Hoch-/Spätmittelalter. Band und Breadcrumb lösen denselben Baum auf und zeigen dadurch immer dieselbe Ebene.
- **Startseite: Epochen-Kacheln aufklappbar:** Die Übersicht zeigte alle 20 Kacheln gleichzeitig flach untereinander, die Hierarchie war nur an der Einrückung erkennbar. Jetzt starten die 6 Hauptepochen eingeklappt; ein Tap auf den Kachelkörper klappt die Unterepochen auf (Chevron ▸/▾), der nachgestellte →-Button springt direkt in den Zeitstrahl.

### Added

- **SEO: Social-Preview-Bild, Favicons und crawlbarer Inhalt:** `public/index.html` verlinkte weder ein `og:image`/`twitter:image` (Link-Vorschau bei Slack/Twitter/WhatsApp blieb leer) noch einen Favicon-Link/`theme-color`. Neu: `public/og-image.png` (1200×630, Timeline-Motiv) für Open-Graph/Twitter-Card (`summary_large_image`), `public/favicon.png` + `public/apple-touch-icon.png`, `theme-color`. Zusätzlich: Da die Zeitachse als Canvas gerendert wird, enthielt die Seite unabhängig von JS-Ausführung **keinerlei crawlbaren Text** — ein visuell verstecktes, aber im DOM vorhandenes `#seo-content`-Element (h1 + Beschreibung + Kategorien-Liste) gibt Suchmaschinen jetzt echten Seiteninhalt.

- **Erste Komponenten-Tests im Projekt:** Bisher gab es ausschließlich Logik-Tests; `src/components/` war komplett ungetestet, obwohl dort die gesamte Renderer-Duplizierung lag. 10 Render-Tests für die neuen geteilten Komponenten (`@testing-library/react-native` war bereits installiert, Jest matcht `*.test.tsx` — es waren keinerlei Setup-Änderungen nötig). Sie prüfen unter anderem, dass ein Breadcrumb-Tap auf die Range **seiner Epoche** zoomt und nicht auf den aktuellen Viewport, dass der Coverage-Guard beim Herauszoomen greift und dass Cluster-Badges nur bei echtem Überlauf erscheinen.

### Fixed

- **Sechsstellige Jahreszahlen zeigten irreführende Scheingenauigkeit:** `formatEventYear` formatierte Jahre unter 1 Mio. weiterhin mit Tausender-Trennzeichen, z. B. „555,596 v. Chr." statt einer sinnvoll gerundeten Angabe. Ab 100.000 wird jetzt wie bei den Millionen-/Milliarden-Stufen mit einer Nachkommastelle als „Mio." formatiert (z. B. „0,6 Mio. v. Chr.").
- **Drei widersprüchliche Epochen-Datensätze vereinheitlicht:** Epochengrenzen existierten in drei Varianten nebeneinander — `epochs.ts` (flach, 10 Einträge) definierte die Antike als −500…500, der Navigationsbaum in `epoch.ts` als −800…600, und die Pfeil-Navigation nutzte eine dritte abgeflachte Teilmenge. Dieselbe Epoche begann also je nach Bedienelement in einem anderen Jahr. `epoch.ts` ist jetzt die einzige Quelle: Die Grenzen des Baums gewinnen, weil nur sie in sich stimmig sind (die Werte aus `epochs.ts` ließen `earlyAntiquity` aus seinem Elternknoten herauslaufen). Neue Tests sichern die Deckungs-Invariante ab — jede Baumebene deckt den Zeitstrahl lückenlos und überschneidungsfrei ab, Kinder kacheln ihre Eltern exakt. Ebenso zusammengeführt: drei duplizierte Farbtabellen (20/11/10 Einträge) → `color` am Baumknoten.
- **Web- und Native-Renderer verwenden denselben Viewport-Bereich:** Der Web-Renderer berechnete `visibleStartYear`/`visibleEndYear` lokal, während Native den bereits in `TimelineView` berechneten `viewportRange` bekam — zwei Quellen für denselben Wert. Web erhält den Bereich jetzt ebenfalls als Prop.

### Added

- **Archaische Homininen-Linien & Introgressions-Chronologie (Issue #121):** 7 neue Events in `erdzeitalter.json` erweitern „Frühmenschen" um die bislang fehlenden archaischen Populationen aus aktuellen populationsgenetischen Rekonstruktionen: Denisova-Mensch (`frueh-denisova-mensch`, Asien), „Super-archaische" Linie (`frueh-super-archaisch`) und „Ghost-Population" Afrikas (`frueh-ghost-population`). Zusätzlich verbindet eine neue `lineageId` (`fruehmenschen-phylogenie`) vier zeitpunktartige Abspaltungs-/Vermischungs-Ereignisse (Super-archaisch-Split −1,7 Mio., Ghost-Split −830.000, Neandertaler/Denisova-Split −450.000, archaische Introgression in Homo sapiens −50.000 bis −40.000) zu einer durchgehenden Verbindungslinie, die die Abstammungsbeziehungen zwischen den Linien sichtbar macht — analog zum Introgressions-Baum (Super-archaic → Denisovan/Neanderthal → moderne Kontinentalpopulationen) aktueller genomischer Forschung.
- **Schulwissen-Abdeckung über alle Kategorien (Issue #76/#121):** Der Detailgrad-Filter „Wesentliches" heißt jetzt **„Kinder / Schulwissen"** (EN: „Kids / school basics") und liefert typisches Schulwissen in **jeder** Kategorie. Bislang war die `core`-Stufe stark unausgewogen (herrscher 2, nation 7, erdzeitalter 1 core). 118 zentrale Ereignisse wurden auf `importance: 'core'` hochgestuft — u. a. die Erdzeitalter samt Dinosaurier-Ära (Mesozoikum) und Frühmenschen (Australopithecus → Homo sapiens, Feuer, Neolithikum), die bekanntesten Herrscher (Alexander, Caesar-Umfeld, Karl der Große, Napoleon, Bismarck, Kleopatra, Ramses II., Dschingis Khan, Mandela …) und Nationen/Epochen (Athen, Sparta, HRR, Kolumbus, US-Unabhängigkeit, Deutsches Kaiserreich, Mondlandung …). Ergebnis: erdzeitalter 10, herrscher 50, nation 35, zivilisation 86, natur 46 core. Zusätzlich 4 neue Schulwissen-Ereignisse ergänzt: Erste Olympische Spiele der Antike (-776), Varusschlacht (9), Entstehung des Christentums (30), Mauerfall & Deutsche Wiedervereinigung (1989/90).
- **Kinderdarstellung / Lernsprüche (Issue #171):** Neues optionales Event-Feld `mnemonic` für bekannte Eselsbrücken zu Jahreszahlen, im `EventDetailModal` unterhalb der Beschreibung hervorgehoben dargestellt (i18n-Label `event.mnemonic`). Ergänzt bei der Gründung Roms ("753, Rom kroch aus dem Ei.", `eu-herr-romulus`) und einem neuen Event für die Schlacht bei Issos 333 v. Chr. (`eu-schlacht-issos`, Alexander der Große gegen Dareios III.).
- **Kategorie „Kultur & Kunst" (Issue #76):** Neue sechste Kategorie (`kultur`, `#A85FC2`, unterste Lane) für gesellschaftliche Strömungen und Kunstgeschichte. 8 neue Events in `europa.json`: Barock, Wiener Klassik, Weimarer Klassik, Romantik, Biedermeier, Impressionismus, Expressionismus, Bauhaus.
- **Einschlagsereignisse unter „Erdzeitalter" (Issue #76):** 3 neue Events in `erdzeitalter.json` markieren wichtige Kometen-/Asteroideneinschläge direkt in der Erdzeitalter-Lane: Vredefort-Impakt (größter bekannter Einschlagkrater), Sudbury-Impakt und das Tunguska-Ereignis (1908).
- **Zivilisation vs. Nation – konzeptionelle Abgrenzung (Issue #76):** `docs/event-flags.md` dokumentiert jetzt die semantische Trennung für neue Inhalte: `zivilisation` = Völker/Kulturkreise/Wanderungsbewegungen, `nation` = konkrete Staatsgebilde (Königreiche, Kaiserreiche, moderne Staaten). Gilt für neue/überarbeitete Events, keine rückwirkende Migration bestehender Daten.
- **Wissenschaft-Erfindungen ergänzt (Issue #151):** 4 neue Meilensteine in `natur-wissenschaft.json`: Erfindung des Rades (-3500), Cai Lun/Papier (105), Magnetkompass (1040), Schießpulver (850).

### Fixed

- **Kategorie „Natur & Wissenschaft" zeigte keine Inhalte:** `natur-wissenschaft.json` (68 Events, inkl. der 4 neuen aus #151) wurde nie in `src/data/events/index.ts` importiert und war dadurch nie Teil von `ALL_EVENTS` — die Kategorie war seit ihrer Einführung faktisch leer, unabhängig von Filtern oder Zoomlevel. Datei jetzt korrekt eingebunden.
- **Punkt-Ereignisse ohne Beschriftung (Issue #160):** Ereignisse ohne `endYear` (z. B. Chicxulub-Einschlag, Toba-Superausbruch) hatten in `computeLabelVisibleIds` immer eine berechnete Balkenbreite von 0 px und fielen dadurch garantiert unter `LABEL_MIN_BAR_PX` — sie bekamen nie ein Label, unabhängig vom Zoomlevel, obwohl der gerenderte Balken (`Math.max(2, …)`) sichtbar war. Punkt-Ereignisse erhalten jetzt einen virtuellen Label-Slot der Breite `LABEL_MAX_WIDTH` rechts neben dem Marker (beide Renderer, Web + Native).
- **Vertikales Scrollen zwischen Spuren auf Mobile (Issue #161):** Der RNGH-Pan-Gesture des Zeitstrahls konkurrierte mit der äußeren `ScrollView` um vertikale Touch-Gesten, ohne dass beide explizit verdrahtet waren. `useTimelineGestures` nimmt jetzt optional eine `scrollRef` entgegen und registriert sie via `simultaneousWithExternalGesture`, damit die `ScrollView` vertikale Drags zuverlässig erkennt, statt das Touch-Event an den Pan-Handler zu verlieren.

### Added

- **FPS-Monitor (Issue #5):** Neue optionale Overlay-Anzeige der gemessenen Bildrate oben rechts im Zeitstrahl, misst per Reanimated `useFrameCallback` (500ms-Fenster) auf beiden Plattformen. Standardmäßig aus, Umschalter unter Einstellungen → Darstellung → „FPS-Monitor anzeigen" (persistiert via AsyncStorage `showFpsMonitor`). Farbcodiert (≥50 grün, ≥30 gelb, darunter rot) als schnelles Diagnosewerkzeug für die laufende Performance-Optimierung von Skia/Reanimated.

- **Hierarchie-Ebene `tier` für Zeilen-Ordnung (Issue #70):** Neues optionales Schema-Feld `tier: 'epoche' | 'reich' | 'dynastie'` ordnet die Zeilen innerhalb einer Lane. `assignTracks` sortiert jetzt **primär nach `tierRank`** (epoche=0 oben, reich=1 Mitte, dynastie=2 unten), erst danach global-first + chronologisch. Dadurch bilden die europäischen Epochen-Bänder (Frühmittelalter → Renaissance → Wissenschaftliche Revolution → Aufklärung → Industrialisierung) eine durchgehende obere Zeitleiste, während langlaufende Reiche wie Byzanz (330–1453) als `reich` darunter liegen — vorher stand Byzanz über der Renaissance, weil die `culture`-Gruppierung Epochen-Phasen und echte Reiche vermischte. Fehlendes `tier` gilt als `reich` (Default, abwärtskompatibel); 8 Epochen-Bänder in `europa.json` explizit auf `epoche` gesetzt. Die kultur-homogenen Spuren (Plantagenet → Tudor) bleiben _innerhalb_ eines Tiers erhalten. Die `dynastie`-Ebene ist vorbereitet, wird aber erst in einem Folge-PR bespielt.

- **SEO-Grundausstattung (Issue #149, Schritt A+B):** `public/index.html` überschreibt das Metro-Web-Standardtemplate mit Meta-Description, Open-Graph- und Twitter-Card-Tags sowie einem `WebApplication`-JSON-LD-Block (Schema.org) für die Produktions-URL. `public/robots.txt` erlaubt Crawlern vollen Zugriff und referenziert `public/sitemap.xml` (Root-URL der Web-Version). Beide Dateien landen unverändert im `expo export --platform web`-Output (Metro kopiert `public/` 1:1 in `dist/`).

### Fixed

- **`herrscher`-Kategorie war unsichtbar (Issue #146):** Die Kategorie „Herrscher & Dynastien" hatte einen Filter-Chip, aber kein `laneOrder` — die 116 gepflegten Events (römische Kaiser, englische/französische Dynastien, Präsidenten …) wurden nie gerendert. `laneOrder: 4` ergänzt → wird jetzt als unterste Lane (feinste Detailebene unter Nationen) angezeigt. Durch die kultur-getrennten Zeilen clustern die meist sequenziellen Herrscher sauber (z. B. alle römischen Kaiser in einer Zeile).
- **Lane-Labels hochkant (PR #124):** `LANE_LABEL_WIDTH` 96 → 28 px. Labels werden mit einem inneren View (width=laneHeight, height=28) um –90° gedreht – spart 68 px Canvas-Breite auf Web und Native.
- **Zukunfts-Padding behoben (PR #124):** `PRESENT_RIGHT_PAD_FRACTION` (skalierte mit Viewport-Spanne: 15 % von 5 Mrd. Jahren = 750 Mio. Jahre Zukunfts-Scroll) ersetzt durch `PRESENT_RIGHT_BUFFER_YEARS = 200` – fester Puffer unabhängig vom Zoom-Level.
- **Achsen-Anker am linken Viewport-Rand (PR #124):** `generateTicks` prependet jetzt ein Anker-Label bei px=0 mit dem formatierten Viewport-Startjahr, wenn der erste reguläre Tick mehr als `TICK_LABEL_WIDTH` (90 px) vom linken Rand entfernt ist. Der sichtbare Bereich hat immer eine Datumsbeschriftung am Anfang.

### Added

- **Stabile Track-Zuordnung (Issue #146 B1):** Track-/Zeilenzuordnung pro Lane wird jetzt einmal viewport-unabhängig über die gesamte gefilterte Event-Menge (Kontinent + Detailgrad) berechnet (`buildStableTracksByLane`, memoisiert in `TimelineView`) statt bei jedem Pan/Zoom-Frame neu über die gecappte Sichtmenge. Events springen dadurch beim Scrollen nicht mehr zwischen Zeilen. `computeLaneData` remappt die sichtbaren globalen Tracknummern zusätzlich dicht auf 0..k, damit große Lücken zwischen global weit auseinanderliegenden Events keine überdimensionierte Lane-Höhe erzeugen. `EventIndex.getFilteredCategory` liefert dafür alle Events einer Kategorie ohne Zeitraum-Filter (aber inkl. Kontinent/Importance).
- **Kultur-getrennte Themen-Spuren (Issue #146 B2):** Zeilen sind jetzt semantisch homogen — jede automatisch vergebene Zeile gehört genau einer `culture` (bzw. ist neutral für Events ohne Kultur), Events verschiedener Kulturen teilen sich **nie** eine Zeile. Vorher packte `assignTracks` rein geometrisch (jede freie Zeile nahm jedes Event), wodurch z. B. Tudor-Dynastie, Byzantinisches Reich und Aufklärung gemischt in einer Zeile landeten. Jetzt entstehen durchgehende Spuren wie Plantagenet→Tudor (englisch), Kapetinger→Valois→Bourbon→Napoleon (französisch) oder Luther→Dreißigjähriger Krieg→Einigung→Berliner Mauer (deutsch) direkt aus dem vorhandenen `culture`-Feld, ohne `lineageId`-Datenpflege. Kosten: mehr Zeilen pro Lane (eine je sichtbarer Kultur) — durch das viewport-lokale Dense-Remapping aus B1 bleibt die Höhe begrenzt.
- **Suche & Sprung zu Ereignissen (Issue #146 A):** Neues 🔍-Icon im Header (Timeline- und Epochen-Übersicht-Screen) öffnet ein Such-Overlay. Sucht über Titel, `culture` und `tags` aller Events (`searchEvents`, Präfix-/Substring-Match, diakritik-insensitiv); erkennt reine Jahreszahlen inkl. „v. Chr."/„n. Chr."/„Mio." (`parseYearQuery`) und bietet „Springe zu Jahr X" als eigenen Treffer an. Tap auf einen Ereignis-Treffer aktiviert automatisch dessen Kategorie und (falls nötig) Kontinent, verlässt die Epochen-Übersicht und löst in `TimelineView` einen Zoom-to-fit mit Minimap-Highlight-Puls und verzögertem Öffnen des Detail-Modals aus (`jumpToEvent`-Prop, analog zum bestehenden Tap-to-Zoom-Muster). Tap auf „Springe zu Jahr" zentriert den Viewport ohne Filter-/Modal-Änderung (`jumpToYear`-Prop).
- **Lineage-Verbindungslinien (lineageId verdrahtet):** `assignTracks` legt Events mit gleicher `lineageId` bevorzugt in dieselbe Zeile (sofern überlappungsfrei); neue `computeLineageConnectors`-Funktion erzeugt Verbindungslinien zwischen aufeinanderfolgenden Lineage-Events, die beide Renderer (Skia/Web) unter den Balken zeichnen. Macht politische Nachfolge (z. B. polynesische/Bantu-Expansion, Java-Reiche) sichtbar.
- **Detailgrad-Filter (`importance` verdrahtet):** Neuer `DetailLevelSelector` (Wesentliches/Standard/Alles) als kumulativer Schwellwert über das `importance`-Feld — manuelle Ergänzung zum automatischen Zoom-LOD. Persistiert via AsyncStorage (`detailLevel`), Default „Alles" (abwärtskompatibel). Events ohne `importance` zählen als `extended`.
- **Wissenschaft-Events gerettet (#122):** 4 Events aus `feature/natur-wissenschaft-highlights-v3` wurden wiederhergestellt, die beim Merge von v5 verloren gingen: Einstein Annus Mirabilis (1905), Sputnik 1 (1957), Juri Gagarin (1961), Apollo 11 (1969). `natur-wissenschaft.json` enthält jetzt 6 statt 2 Events.
- **CLAUDE.md: Web-Renderer-Doku (#115):** Architekturnotiz zum viewport-relativen Web-Renderer (`TimelineCanvasWeb`, GestureDetector + Mausrad-Shim, unified viewport-Hook) nachgezogen.
- **Ozeanien-Daten (Issue #121):** Neue Datei `src/data/events/ozeanien.json` mit 30 Events: australische Aborigines (65.000 v. Chr.), Lapita-Kultur, polynesische Expansion (Samoa/Tonga → Marquesas → Hawaii → Osterinsel → Maori-Neuseeland) mit `lineageId: "polynesische-expansion"`, Nan Madol, Europäische Entdeckung & Kolonisierung.
- **P2-Content-Lücken geschlossen (Issue #121):**
  - `asien.json` +17: Südostasien (Srivijaya, Pagan, Sukhothai, Ayutthaya, Majapahit, Đại Việt, Malakka-Sultanat); P3: Chinesischer Bürgerkrieg, Koreakrieg, Teilung Koreas, Timuridenreich.
  - `erdzeitalter.json` +9: Regionale Steinzeit-Events (Lascaux, Altamira, Göbekli Tepe, Jōmon-Kultur, San-Kulturen Afrikas, Mal'ta-Buret' Sibirien).
  - `afrika.json` +11: Ishango-Knochen, Bantu-Expansion (`lineageId: "bantu-expansion"`), Nok-Kultur, Garamanten, D'mt-Reich, Kanem-Reich, Kilwa-Sultanat, Mutapa-Reich.
  - `amerika.json` +7: Poverty Point, Pueblo/Anasazi, Cahokia, Tairona-Kultur.
- `lineageId` konsequent in neuen Daten eingesetzt: `"polynesische-expansion"`, `"bantu-expansion"`, `"java-reiche"`, `"srivijaya"` — wird jetzt als Verbindungslinie gerendert (siehe oben).

### Changed

- **Landing-Page-Zeitstrahl jetzt linear (`LandmarkTimeline`):** Die `LandmarkTimeline` auf der Landing Page war zuvor **logarithmisch** skaliert (`logPos`/`Math.log10`). Sie nutzt jetzt eine **lineare Erdgeschichts-Achse** (von der Erdentstehung, -4.6 Mrd., bis heute) — konsistent zur viewport-lokal linearen interaktiven Timeline (Modell B). Der **Urknall** liegt außerhalb der linearen Skala (würde die Erdgeschichte sonst zu einem Punkt stauchen) und wird als fixer Marker links neben der Erdentstehung platziert; beide zeigen ihren **Zeitpunkt** und sind durch einen Achsenbruch (gestrichelte Linie + `//`) getrennt.
- **Lineare Zeitskala (Phase 2, Issue #93):** Die Zeitachse verwendet jetzt
  viewport-lokale lineare Abbildung (Modell B). `yearToT(year) = year` und
  `tToYear(t) = t` sind Identity-Funktionen; `pixelsPerUnit` entspricht
  Pixeln pro Jahr, `offsetX` direkt einem Jahreswert. Der volle 5-Mrd.-Span
  wird im Hauptview bewusst nicht dargestellt – Einstieg über die Landing Page.
  LOD-Grenzen neu kalibriert für lineare Skala (ppu-Schwellen: 2e-6 / 5e-4 /
  0.02 / 2). Viewport-Reaktion in `useTimelineViewport` auf Pixel- bzw.
  PPU-relativ umgestellt (5 px / 1 % Schwelle). Zoom-to-fit für Punkt-Events
  auf 200-Jahr-Minimum erhöht. (#93, Phase 2)

- **Kategorie-Registry als Single Source of Truth** (`src/theme/categories.ts`):
  Farben, Lane-Hintergründe, Paletten, Chip-/Lane-Reihenfolge, Default- und
  Disabled-Auswahl sowie die abgeleiteten Arrays (`VALID_CATEGORIES`,
  `CHIP_CATEGORIES`, `LANE_ORDER`, `DEFAULT_CATEGORIES`, `DISABLED_CATEGORIES`)
  stammen jetzt aus einer einzigen geordneten Config. Eine neue Kategorie = ein
  Eintrag. `tokens.ts`, `FilterChipBar`, `TimelineView`, `TimelineScreen` und die
  Daten-Tests konsumieren die Registry; Optik und Verhalten bleiben identisch.
  (#93, Stufe 1.1)

### Added

- **Schematischer Zeitstrahl (Phase 2.2, Issue #93):** Neue horizontale
  `SchematicTimeline`-Leiste oben auf der Landing Page (EpochOverviewScreen).
  Zeigt alle Top-Level-Epochen als gleich breite, farbige Segmente im
  U-Bahn-Plan-Stil. Tippen auf ein Segment springt direkt zur Epoche.
  Beschriftung via `t('epochNav.<key>')`, vollständig i18n-konform. (#93)
- Farbiges, klickbares **Epochen-Band** direkt unter der Zeitachse (Erde, Dinos,
  Frühmenschen, Antike, Mittelalter, Neuzeit) – ersetzt die separate Chip-Leiste;
  Klick auf ein Segment zoomt zur Epoche. Scrollt mit der Zeitachse mit.
- **„Zu heute"-Button (⌖)** neben den Zoom-Buttons – holt die Ansicht aus jeder
  Position/Zoomstufe zuverlässig zur Gegenwart zurück.
- **Epochen-Übersicht (Landing Page)**: Die App startet jetzt mit einer
  übersichtlichen Epochen-Auswahl statt direkt im Zeitstrahl. Alle Epochen
  von der kosmischen Frühzeit bis zur Neuzeit sind als Kacheln sichtbar –
  mit Zeitraum und tatsächlicher Dauer (z. B. „186 Mio. Jahre" für Dinos).
  Das macht die logarithmische Verzerrung des Zeitstrahls erklärbar: Die
  Zahlen sprechen für sich. (#77)
- **Gezielter Zoom beim Epochen-Einstieg**: Wird eine Epoche auf der
  Landing Page gewählt, öffnet sich der Zeitstrahl direkt auf diesen
  Zeitraum (statt immer bei der menschlichen Vorgeschichte). (#77)
- **Epoch-Chip-Leiste (Drill-Down)**: Eine neue horizontale Chip-Leiste
  unterhalb des Epochen-Bands erlaubt schnellen Epochenwechsel direkt aus
  dem Zeitstrahl – ohne Umweg über die Landing Page. Tap auf
  „Menschheitsgeschichte ▸" zeigt Unterepocen (Steinzeit, Hochkulturen,
  Antike, Mittelalter, Neuzeit); „← Zurück" kehrt zur Übersicht zurück. (#81)
- **Zoom-Animation beim Epochen-Einstieg**: Tap auf eine Epochen-Kachel
  zeigt kurz den Gesamtzeitstrahl, bevor die Kamera auf den Zielbereich
  zoomt (600 ms). Web: ScrollView scrollt sichtbar zum Ziel. (#81)
- **Minimap-Highlight**: Vor dem Epochen-Zoom pulsiert die Zielposition
  ~450 ms auf der Minimap – zeigt dem Nutzer vorab „wohin die Reise geht". (#81)
- i18n: `epochNav.*`-Keys für Landing Page (DE/EN).

### Added

- **Frühmenschen-Spezies** im Zeitstrahl: Australopithecus, Homo erectus,
  Homo heidelbergensis, Neandertaler, Homo sapiens, Out-of-Africa-Migration,
  Höhlenmalerei, Letzte Eiszeit, Neolithikum – alle als globale Events in
  der Zivilisations-Lane sichtbar.
- **Epochen-Band** (EpochBand) jetzt konsistent mit der Chip-Navigation:
  Segmente entsprechen 1:1 den `NAVIGATION_EPOCHS` (kosmische Frühzeit →
  Steinzeit → Frühe Hochkulturen → … → Neuzeit) statt eines eigenständigen
  Sets – gleiche Labels, gleiche Farben.
- Titel und Untertitel im Zeitstrahl-Header sind jetzt klickbar und führen
  zurück zur Epochen-Übersicht (Landing Page).

### Fixed

- Epoch-Chip-Leiste friert nach 2–3 Klicks ein: `hasZoomedToEpochRef`
  wurde nie zurückgesetzt und blockierte alle Folge-Klicks – ersetzt durch
  `lastZoomedEpochRef` mit Koordinatenvergleich. (#82)
- Jahreszahlen auf der Zeitachse zeigten `–15k` statt `15.000 v. Chr.` –
  k/Tsd-Suffix entfernt, alle menschlichen Jahreszahlen nun vollständig
  mit Tausendertrenner und v./n. Chr.-Suffix.
- „Heute" steht näher am rechten Rand: `PRESENT_RIGHT_PAD_FRACTION`
  von 0.5 → 0.15 reduziert.

### Fixed (older) (`useAnimatedReaction` lief

auch auf Web und überschrieb `jsOffsetX` mit einem veralteten Wert) – Reaction
jetzt nur nativ.

- Web: Navigation blieb nach Pan in die Vergangenheit hängen – fragiler
  `webJumpScrollX`-State-Roundtrip entfernt; Sprünge scrollen direkt.
- Web: Zoom nach Klick auf „Neuzeit" sprang zu einem unverwandten früheren Jahr –
  `zoomToFit` nutzt jetzt die echte (in der Log-Skala kurze) Spanne moderner
  Epochen statt eines zu großen Minimums.
- Web: Zoom-/Sprung-Buttons waren unsichtbar (`position:fixed` in einem
  scrollenden Container) – nur noch der Lane-Bereich scrollt, Buttons fix.
- Web: Lanes überlappten bei mehreren Kategorien (Nationen über Zivilisationen) –
  Lane-Höhen werden auf Web aus den scroll-getriebenen Lane-Daten berechnet.
- Performance: Scroll löst erst ab ~6 px Bewegung ein Re-Render aus.
- Zeitstrahl beginnt jetzt bei −5 Mrd (Erdentstehung) statt beim Urknall; mehr
  vertikaler Platz pro Spur (`TRACK_HEIGHT` 60→80).

- i18n: Fehlende/abweichende Übersetzungs-Keys – UI zeigte Roh-Keys statt Texte
  (`app.title`, `app.subtitle`, `category.*`, `continent.europa` …, `zoom.level.*`,
  `chip.soon`, `popover.*`, `event.culture/million/thousand`). DE + EN ergänzt,
  Regressionstest für Key-Vollständigkeit hinzugefügt.
- Zeitachse: Anzahl der Tick-Beschriftungen wird an die Breite angepasst –
  keine überlappenden Jahreszahlen mehr bei schmalen Screens / tiefem Zoom.
- Web: Untere Lanes/Spuren wurden bei mehreren Kategorien am unteren
  Bildschirmrand abgeschnitten – Timeline-Bereich scrollt jetzt vertikal.
- Web: Timeline startete beim initialen Laden immer am Urknall statt bei
  „Heute" – `useWindowDimensions()` liefert beim ersten Render oft `width=0`,
  was `contentOffset` und `pixelsPerUnit` falsch initialisierte. Ein einmaliger
  `useEffect` korrigiert beides nach dem ersten Render mit gültiger Canvas-Breite.

### Changed

- Code-Pflege (#68): Zeit-Span-Konstanten (`T_MIN`/`T_MAX`/`T_PRESENT`,
  `BIG_BANG_YEAR`/`PRESENT_YEAR`, `FULL_T_SPAN`) zentral in `src/timeline/scale.ts`
  als Single Source of Truth. Bisher in `TimelineView` und `lod.ts` dupliziert
  (Risiko divergierender Werte). `lod.ts` re-exportiert sie kompatibel.
- Datenschema gehärtet (#68): `validateEvent()` in `src/data/schema.ts` prüft
  Pflichtfelder inkl. `minZoomLevel`; neue Tests gegen die Event-JSONs und den
  Validator (vorheriger Test übersah ein fehlendes `minZoomLevel`).
- Code-Pflege (#68): Sichtbarkeits-/Track-Berechnung für Web und Native in
  einer geteilten Funktion `computeLaneData()` (`src/timeline/culling.ts`)
  zusammengeführt. Vorher doppelt in `TimelineView` (`visibleByLane`/
  `webVisibleByLane`, `tracksByLane`/`webTracksByLane`, je eigene Overflow-
  Zählung) — Bugfixes mussten zweimal erfolgen. Beide Pfade übergeben jetzt nur
  noch ihren eigenen Sichtbereich; alles Weitere ist identisch.
- Code-Pflege (#68): Viewport-State und Zoom-/Pan-/Jump-Logik aus `TimelineView`
  in den Hook `useTimelineViewport()` (`src/components/useTimelineViewport.ts`)
  extrahiert (offset/ppu-SharedValues, JS-Spiegel, Web-Scroll-Mirror, Worklet↔JS-
  Sync, `zoomToFit`/`zoomAtPoint`/`zoomIn`/`zoomOut`/`handleMinimapJump`).
  TimelineView von ~1187 auf ~1013 Zeilen verschlankt; das plattformabhängige
  Branching liegt jetzt gebündelt im Hook. Kein Verhaltensbruch.
- Code-Pflege (#68): Render-Pfade entflochten — Web und Native sind jetzt
  eigene Komponenten `TimelineCanvasWeb`/`TimelineCanvasNative` hinter einem
  Prop-Interface; geteilte Styles/Konstanten/Helfer in `timelineRenderShared.ts`,
  die Gesten in `useTimelineGestures()`. `TimelineView` ist nur noch Logik +
  Komposition und von ~1013 auf **~359 Zeilen** geschrumpft (ursprünglich 1367).
  Kein Verhaltensbruch. Schließt die Code-Pflege-Akzeptanzkriterien von #68 ab.
- UX: „Heute" lässt sich jetzt zentrieren (Pan/Zoom bis zur Bildschirmmitte),
  da die jüngste Geschichte im Fokus steht. Rechts von „Heute" gibt es bewusst
  keine Achsen-Beschriftung.
- UX: Schnellauswahl-Chips (Urknall, Dinosaurier …) liegen jetzt direkt unter
  der Zeitachse statt unter der Minimap.

### Added

- Mobile-UX: Persistenter Zoom-Level-Indikator (Äonen → Jahre) (#36)
- Mobile-UX: Epochen-Kontext im Breadcrumb (z. B. „Mesozoikum") (#37)
- Mobile-UX: Doppeltipp zum Hineinzoomen (zentriert auf den Tap-Punkt) (#43)

### Changed

- Mobile-UX: Mindest-Trefferzone von 44px pro Event – auch dünne Balken sind sicher antippbar (#33)
- Mobile-UX: Tap/Pan-Trennung – Auswahl erst beim Loslassen statt beim Berühren, weniger Fehl-Taps und versehentliches Scrollen (#34)
- Mobile-UX: Zoom-/Home-Buttons auf 44px vergrößert (#45)
- Web: Zeitachse und Kategorie-Labels bleiben beim vertikalen Scrollen sichtbar (sticky)
- Web: Zoom-Buttons fixiert (immer rechts unten sichtbar)
- Web & Native: Pan/Zoom-Clamp – kein Scrollen über „Heute" hinaus in die Zukunft möglich
- Track-Höhe von 52px auf 60px erhöht, Lane-Padding von 8px auf 10px (mehr Luft zwischen Balken)

## [0.1.0] - 2026-06-07

### Added

- Interaktiver logarithmischer Zeitstrahl (Urknall bis heute) mit Skia-Rendering
- Europa-Datensatz: Hochkulturen + Erdzeitalter
- Asien, Afrika & Amerika: 140 historische Events (#8)
- Kontinent-Switcher + Kategorie-Filter mit AsyncStorage-Persistenz (#6)
- Accessibility-Verbesserungen: Screen Reader, Rollen, Zustände (#9)
- Design-System: Token-Erweiterung & UI-Primitives (#11)
- 48 Unit-Tests (#10)
- Deutsch/Englisch Unterstützung (i18n) (#7)
- Mobile-UX-Überarbeitung: Orientierung, lesbare Labels, parallele Balken (#26)
- Standardisierung: CLAUDE.md, Commands, CI-Standards, Prettier, protect-main (#28)
