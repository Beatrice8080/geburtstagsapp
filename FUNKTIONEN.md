# Geburtstagsapp – Funktionsübersicht

Version 1.0.0 · Progressive Web App für iPhone (iOS 16.4+)

---

## Installation

1. Safari öffnen und die App-URL aufrufen
2. Teilen-Symbol antippen → „Zum Home-Bildschirm"
3. Die App kann danach wie eine normale App geöffnet werden
4. Funktioniert vollständig offline – keine Internetverbindung erforderlich

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
**🎂 Geburtstage**-Button am unteren Rand der Kalenderansicht. Das
Slide-up-Overlay erscheint dabei genau wie beim App-Start und schließt
sich wieder mit dem **×**-Button.

---

## Kalenderansicht

Zeigt einen Monatskalender:

| Element | Bedeutung |
|---|---|
| Lila Punkt unter einem Tag | An diesem Tag ist mindestens ein Geburtstag eingetragen |
| Roter Rahmen um den Tag | Das ist heute |
| ‹ / › | Zum vorherigen / nächsten Monat wechseln |
| **Heute** (rechts oben) | Springt zurück zum aktuellen Monat |
| ⚙ (links oben) | Öffnet die Einstellungen |
| 🎂 Geburtstage (unten) | Öffnet den Startbildschirm erneut |

**Tipp:** Ein Tipp auf einen beliebigen Tag öffnet die Tages-Detailansicht.

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

Erreichbar über das ⚙-Symbol in der Kalenderansicht.

### Benachrichtigungen

iOS-Web-Apps können keine Benachrichtigungen senden, wenn die App
geschlossen ist. Das ist eine technische Plattformbeschränkung.

**Empfehlung:** Öffne die App regelmäßig – beim Start siehst du sofort,
wer heute oder in den nächsten Tagen Geburtstag hat.

### Export

Exportiert alle gespeicherten Geburtstage als CSV-Datei:

- **Dateiname:** `geburtstage_export_JJJJ-MM-TT.csv`
- **Spalten:** Name, Tag, Monat, Jahrgang, Kategorie, Notiz
- **Encoding:** UTF-8 mit BOM → Umlaute werden in Excel korrekt dargestellt
- Leere Felder bleiben leer (kein „null" oder „–")

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

---

## Ikonaustausch (für Entwickler)

Die Platzhalter-Icons können jederzeit durch eigene Grafiken ersetzt werden:

| Datei | Größe | Verwendung |
|---|---|---|
| `icons/icon-180.png` | 180 × 180 px | iOS Home-Bildschirm-Icon |
| `icons/icon-192.png` | 192 × 192 px | Android / PWA-Icon |
| `icons/icon-512.png` | 512 × 512 px | PWA Splash Screen |

Anforderungen: PNG-Format, kein transparenter Hintergrund, quadratisch.
iOS rundet die Ecken automatisch ab.
