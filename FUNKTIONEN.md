# Geburtstagsapp – Funktionsübersicht

Version 1.2.0 · Progressive Web App für iPhone (iOS 16.4+)

---

## Installation

1. Safari öffnen und die App-URL aufrufen
2. Teilen-Symbol antippen → „Zum Home-Bildschirm"
3. Die App kann danach wie eine normale App geöffnet werden
4. Funktioniert vollständig offline – keine Internetverbindung erforderlich

---

## Navigation

Am unteren Rand der App befindet sich eine Tab-Leiste mit drei Bereichen:

| Tab | Bedeutung |
|---|---|
| **Aktuell** (Geschenk-Icon) | Öffnet den Startbildschirm mit den nächsten Geburtstagen |
| **Kalender** | Öffnet die Monatskalenderansicht |
| **Mehr** (Zahnrad-Icon) | Öffnet die Einstellungen |

---

## Startbildschirm

Beim Öffnen der App erscheint automatisch eine Übersicht mit den
Geburtstagen der nächsten drei Tage:

- **Heute** – alle Geburtstage des heutigen Tags
- **Morgen** – alle Geburtstage des morgigen Tags
- **Übermorgen** – alle Geburtstage des übernächsten Tags

Jeweils angezeigt: Name, Jahrgang (falls eingetragen), Alter im
aktuellen Jahr und Kategorie.

Schließen über das **×** rechts oben → wechselt zum Kalender.

Der Startbildschirm kann jederzeit erneut geöffnet werden – über den
**Aktuell**-Tab in der Tab-Leiste am unteren Rand.

---

## Kalenderansicht

Zeigt einen Monatskalender:

| Element | Bedeutung |
|---|---|
| Lila Punkt unter einem Tag | An diesem Tag ist mindestens ein Geburtstag eingetragen |
| Roter Rahmen um den Tag | Das ist heute |
| ‹ / › | Zum vorherigen / nächsten Monat wechseln |
| **Heute** (links oben) | Springt zurück zum aktuellen Monat |
| 🔍 (rechts oben) | Öffnet die Suchfunktion |

**Tipp:** Ein Tipp auf einen beliebigen Tag öffnet die Tages-Detailansicht.

---

## Suchfunktion

Erreichbar über das 🔍-Symbol in der Kalenderansicht.

Ermöglicht das Suchen nach Geburtstagen anhand von Name und/oder Jahrgang.
Die Ergebnisse zeigen Geburtstage der nächsten 365 Tage, gruppiert nach
Datum und aufsteigend sortiert.

| Feld | Details |
|---|---|
| **Name** | Suche nach Namensbestandteil (Groß-/Kleinschreibung egal) |
| **Jahrgang** | Suche nach exaktem Geburtsjahr |

Beide Felder können einzeln oder kombiniert verwendet werden. Enter oder
„Suchen" startet die Suche. Ein Tipp auf ein Ergebnis öffnet die
Tages-Detailansicht des jeweiligen Geburtstags.

---

## Tages-Detailansicht

Zeigt alle Geburtstage des ausgewählten Tags.

Für jeden Eintrag:
- Name
- Jahrgang und daraus berechnetes Alter (falls eingetragen)
- Kategorie (falls eingetragen)
- Notiz (falls eingetragen)

**Aktionen:**
- **Bearbeiten** – öffnet die Bearbeitungsmaske mit vorausgefüllten Daten
- **Löschen** – öffnet eine Sicherheitsabfrage vor dem endgültigen Löschen
- **+ Geburtstag hinzufügen** – öffnet die Eingabemaske für den ausgewählten Tag

---

## Geburtstag hinzufügen

Das Formular öffnet sich mit Tag und Monat des ausgewählten Tages
vorausgefüllt. Das Datum ist in dieser Ansicht nicht änderbar.

| Feld | Pflicht | Details |
|---|---|---|
| Name | ✓ | Max. 100 Zeichen |
| Jahrgang | – | Dropdown 1900–aktuelles Jahr, Vorauswahl: kein Jahrgang |
| Kategorie | – | Familie / Freund\*innen / Kolleg\*innen |
| Notiz | – | Freitext, max. 500 Zeichen |

**Speichern** sichert den Eintrag · **Abbrechen** verwirft die Eingabe.

---

## Geburtstag bearbeiten

Identisch mit der Eingabemaske, aber mit bestehenden Daten vorausgefüllt.
Hier ist zusätzlich das **Datum (Tag und Monat) änderbar**.

---

## Geburtstag löschen

Erscheint nach Tippen auf „Löschen" in der Tages-Detailansicht:

> „Möchtest du diesen Eintrag wirklich löschen?
> Diese Aktion kann nicht rückgängig gemacht werden."

**Löschen** entfernt den Eintrag endgültig · **Abbrechen** schließt den Dialog.

---

## Einstellungen

Erreichbar über den **Mehr**-Tab in der Tab-Leiste.

### Export

Exportiert alle gespeicherten Geburtstage als CSV-Datei:

- **Dateiname:** `geburtstage_export_JJJJ-MM-TT.csv`
- **Spalten:** Name, Tag, Monat, Jahrgang, Kategorie, Notiz
- **Encoding:** UTF-8 mit BOM → Umlaute werden in Excel korrekt dargestellt
- Leere Felder bleiben leer (kein „null" oder „–")

### Import

Importiert Geburtstage aus einer CSV-Datei im gleichen Format wie der Export.
Bestehende Einträge werden nicht überschrieben.

**Dateiformat:**
- Nur CSV-Dateien (`.csv`)
- Spaltenreihenfolge: Name, Tag, Monat, Jahrgang, Kategorie, Notiz
- Erste Zeile wird als Kopfzeile erkannt und übersprungen
- Trennzeichen: Komma oder Semikolon – wird automatisch erkannt
- Tag und Monat mit oder ohne führende Null (z. B. `01` oder `1`)

**Gültige Werte:**

| Feld | Pflicht | Gültige Werte |
|---|---|---|
| Name | ✓ | Beliebiger Text |
| Tag | ✓ | 1–31 (je nach Monat) |
| Monat | ✓ | 1–12 |
| Jahrgang | – | 1900–aktuelles Jahr, oder leer |
| Kategorie | – | leer, `Familie`, `Freund*innen`, `Kolleg*innen` |
| Notiz | – | Beliebiger Text, oder leer |

**Verhalten beim Import:**
- Bereits vorhandene Einträge (gleicher Name, Tag und Monat) werden automatisch übersprungen
- Fehlerhafte Zeilen werden übersprungen, der Rest wird importiert
- Eine Zeile gilt als fehlerhaft bei: fehlendem Name, ungültigem Datum (z. B. 31. Februar), ungültigem Jahrgang oder ungültiger Kategorie

**Rückmeldung nach dem Import:**

Nach Abschluss erscheint ein Dialogfenster mit dem Ergebnis, z. B.:

> ✓ Der Import wurde erfolgreich abgeschlossen
>
> 3 Einträge wurden neu importiert.
> 2 schon vorhandene Einträge wurden nicht mehr importiert.
>
> 1 Zeile wurde übersprungen:
> Zeile 5: Ungültiges Datum (31. Februar)

Bei einem technischen Fehler (z. B. unleserliche Datei):

> ✕ Der Import wurde abgebrochen

### Benachrichtigungen

iOS-Web-Apps können keine Benachrichtigungen senden, wenn die App
geschlossen ist. Das ist eine technische Plattformbeschränkung.

**Empfehlung:** Öffne die App regelmäßig – beim Start siehst du sofort,
wer heute oder in den nächsten Tagen Geburtstag hat.

### App aktualisieren

Prüft, ob eine neue Version verfügbar ist, und lädt sie herunter.
Nach erfolgreicher Aktualisierung wird die App automatisch neu geladen.

**Hinweis:** Vor der Aktualisierung alle Geburtstage als CSV exportieren –
die Daten bleiben zwar in der Regel erhalten, aber Vorsicht schadet nie.

Mögliche Rückmeldungen:

| Meldung | Bedeutung |
|---|---|
| ✓ Du hast bereits die neueste Version. | Kein Update verfügbar |
| (App lädt neu) | Update wurde heruntergeladen und aktiviert |
| Aktualisierung fehlgeschlagen. | Kein Internetzugang oder technischer Fehler |

---

## Datenspeicherung

Alle Daten werden **ausschließlich lokal** auf dem Gerät gespeichert
(Browser-localStorage). Es werden keine Daten an Server übertragen.

- Keine Registrierung erforderlich
- Keine Cloud-Synchronisation
- Daten bleiben auch nach dem Schließen der App erhalten
- Daten gehen verloren, wenn der Browser-Cache vollständig geleert wird

**Tipp:** Nutze den Export regelmäßig als Sicherungskopie.

---

## Fehlermeldungen

| Situation | Meldung |
|---|---|
| Name-Feld leer | „Bitte gib einen Namen ein." |
| Speichern fehlgeschlagen | „Speichern fehlgeschlagen. Bitte versuche es erneut." |
| Export fehlgeschlagen | „Export fehlgeschlagen. Bitte versuche es erneut." |
| Ungültiges Datum (Edit-Modus) | „Dieses Datum existiert nicht. Bitte überprüfe Tag und Monat." |
| Importdatei nicht lesbar | „Datei konnte nicht gelesen werden." |
