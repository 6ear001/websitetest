# D-Group Storage & Shipping – Paketlager

Lagersystem für einen Paketshop (**DPD, GLS, J&T Express**): Pakete annehmen, schnell wiederfinden,
an Kunden ausgeben, Retouren annehmen, Übersicht je Anbieter und Rechnungen an die Anbieter.

Reine Web-App ohne Server und ohne Installation. Funktioniert am PC, Tablet und Handy.

## Starten

* Lokal: `index.html` im Browser öffnen (Doppelklick).
* Online/Handy: GitHub Pages für dieses Repo aktivieren (Settings → Pages → Branch wählen) und die Adresse
  auf dem Handy öffnen (HTTPS wird für den Kamera-Scan benötigt).

## Funktionen

| Bereich | Was geht |
|---|---|
| **Annahme** | Sendungsnummer scannen/tippen → Anbieter wird erkannt → Name → Regalplatz → Enter. Umschalter **Paket / Retoure**. Warnung bei doppelter Nummer. USB-/Bluetooth-Scanner funktionieren wie eine Tastatur. |
| **Lager** | Live-Suche nach Name, Sendungsnummer (auch nur Teil/letzte Ziffern, auch langer Barcode), Regal. Filter Anbieter/Status/Typ. Scan + Enter öffnet direkt die Ausgabe. Mehrere Pakete eines Kunden gemeinsam ausgeben. Überfällige Pakete (Lagerfrist) rot markiert. |
| **Ausgabe** | Kunde holt ab: Abholer-Name, „Ausweis geprüft“, Zeitstempel. |
| **Retoure** | Kunde gibt Retoure ab → im Lager bis der Fahrer sie mitnimmt. **Fahrerabholung**: Liste je Anbieter, Übergabeliste zum Unterschreiben drucken, alles als übergeben markieren (auch nicht abgeholte Pakete als Rücksendung). |
| **Übersicht** | Pro Monat und Anbieter: eingenommene Pakete, Retouren, abgeholt, übergeben, aktuell im Lager, überfällig, Vergütung. Verlauf 6 Monate. |
| **Abrechnung** | Pro Monat und Anbieter eine Rechnung (fortlaufende Nummer `RE-JJJJ-NNNN`, MwSt oder Kleinunternehmer, Anlage mit allen Sendungsnummern, als PDF druckbar). Zahlungsstatus. Monatsbericht und CSV-Export für Excel. |
| **Einstellungen** | Shop-Daten, Steuer, Lagerfrist, Anbieter-Adressen und **Vergütung je Paket/Retoure**, Backup/Import, Beispieldaten. |

## Wichtig: Daten und Backup

Die Daten liegen im Browser-Speicher (localStorage) **des Geräts, auf dem du arbeitest** – nicht in der Cloud.
Mehrere Geräte teilen sich keine Daten. Bitte regelmäßig **Einstellungen → Backup herunterladen**
(die App erinnert nach 7 Tagen). Browserdaten nicht löschen, ohne vorher zu sichern.

## Entwicklung

```bash
node tests/logic.test.js   # Tests der Logik (Suche, Statistik, Rechnung, Backup …)
```

* `js/logic.js` – reine Logik, `js/app.js` – Oberfläche, `css/style.css` – Design.
* Die Anbieter-Erkennung (`detectCarrier`) ist nur ein Vorschlag: DPD 14 Ziffern, GLS 11–12 Ziffern, J&T beginnt mit `JT`/`JMX`.
