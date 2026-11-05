# FOKUS Lernzentrum – neues Design

Das neue Design für fokuslernzentrum.de, als Vorschau unter https://meldaaksu.github.io/fokus-vorschau/.
Die echte Website läuft weiter unverändert bei STRATO.

- Deutsche Seiten liegen im Hauptordner. Türkisch (`tr/`) und Englisch (`en/`) werden daraus erzeugt:
  `python3 _i18n/build.py` (Übersetzungen in `_i18n/texts.py`).
- Das Kontaktformular sendet in der Vorschau nichts (`data-preview`).
