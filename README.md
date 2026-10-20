# Vokal-Drohne

Ein kleines, responsives Browser-Spiel zum Üben der Vokale **A, E, I, O, U**. Die Drohne wird aus der Vogelperspektive über ein Raster gesteuert. Auf einem Bombenfeld gilt:

- **A** – ein Feld vorwärts (nach oben)
- **E** – ein Feld nach rechts
- **I** – ein Feld rückwärts (nach unten)
- **O** – ein Feld nach links
- **U** – Bombe unter der Drohne entschärfen

Das Projekt ist bewusst ohne Framework und Build-Schritt umgesetzt: Es kann direkt in einem GitHub-Repository liegen und über GitHub Pages veröffentlicht werden.

## Projektdateien

- `index.html` – Seitenstruktur
- `style.css` – Layout, Farben und iPad-/Mobil-Optimierung
- `game.js` – Spielmechanik, Mikrofonpegel und Spracherkennung
- `.github/workflows/pages.yml` – GitHub-Pages-Deployment
- `.nojekyll` – verhindert Jekyll-Verarbeitung

## Auf dem iPad testen

1. Lade das Projekt in ein GitHub-Repository hoch und aktiviere GitHub Pages (Anleitung unten).
2. Öffne die veröffentlichte `https://...github.io/...`-Adresse in Safari.
3. Tippe auf **Mikrofon aktivieren** und erlaube Safari den Mikrofonzugriff.
4. Sprich jeweils einen einzelnen Vokal und mache zwischen den Äusserungen eine kurze Pause.
5. Wenn die Spracherkennung auf dem Gerät nicht verfügbar ist oder einzelne Vokale nicht erkennt, verwende die Bildschirmtasten.

**Wichtig:** Das Spiel nutzt die Web Speech API, soweit sie vom Browser angeboten wird. Die Unterstützung und die Erkennung einzelner, isolierter Vokale variieren je nach iPadOS-/Safari-Version und Spracheinstellung. Bei manchen Browsern kann die Spracherkennung eine Netzwerkverbindung benötigen. Der Mikrofonpegel allein bewertet noch nicht, ob ein Vokal phonetisch korrekt artikuliert wurde; die Erkennung ist ein spielbarer Prototyp, kein phonetisches Diagnosesystem.

## In GitHub hochladen

### Variante A: Über die GitHub-Weboberfläche

1. Erstelle auf [GitHub](https://github.com/new) ein Repository, z. B. `vokal-drohne`.
2. Entpacke die ZIP-Datei auf deinem Computer.
3. Öffne das neue Repository und wähle **Add file → Upload files**.
4. Lade den **Inhalt** des Projektordners hoch (also `index.html`, `style.css`, `game.js`, `README.md`, `.nojekyll` und den Ordner `.github`).
5. Committe die Dateien auf dem Branch `main`.

### Variante B: Mit Git

```bash
unzip vokal-drohne.zip
cd vokal-drohne
git init
git add .
git commit -m "Erste Version der Vokal-Drohne"
git branch -M main
git remote add origin https://github.com/DEIN-NAME/vokal-drohne.git
git push -u origin main
```

Ersetze `DEIN-NAME` durch deinen GitHub-Benutzernamen und passe bei Bedarf den Repository-Namen an.

## GitHub Pages aktivieren

Der Workflow in `.github/workflows/pages.yml` veröffentlicht das Projekt automatisch bei Pushes auf `main`.

1. Öffne im Repository **Settings → Pages**.
2. Wähle unter **Build and deployment** als Source **GitHub Actions**.
3. Öffne **Actions** und warte, bis der Workflow `Deploy static site to GitHub Pages` erfolgreich durchgelaufen ist.
4. Die Adresse ist normalerweise `https://DEIN-NAME.github.io/vokal-drohne/`.

Beim ersten Deployment kann es ein bis zwei Minuten dauern. Die Website muss über HTTPS geöffnet werden, damit Safari den Mikrofonzugriff zulässt.

## Lokal testen

Da Mikrofonzugriff in Browsern normalerweise einen sicheren Kontext (HTTPS oder localhost) benötigt, öffne `index.html` nicht einfach als `file://`-Datei. Starte stattdessen einen lokalen Server, zum Beispiel mit Python:

```bash
python3 -m http.server 8000
```

Dann `http://localhost:8000` im Browser öffnen. Das funktioniert auf dem gleichen Computer; für das iPad ist GitHub Pages oder ein anderer HTTPS-Host am einfachsten.

## Nächste Ausbaustufen

- Phonetische Auswertung der Vokalqualität anhand von Formanten (F1/F2) statt reiner Spracherkennung
- Schwierigkeitsstufen, Zeitmessung und Punktesystem
- Geräusche und Animationen bei Bewegung und Entschärfung
- Anpassbare Anzahl und Position der Bomben
