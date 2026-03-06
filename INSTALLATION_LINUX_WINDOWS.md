# Keur Ya Aicha - Documentation d'installation Linux et Windows

Date de reference: 6 mars 2026

Ce document explique l'installation, la mise a jour et la desinstallation pour:
- Linux (AppImage)
- Windows (package `win-unpacked` zip)

## 1) Fichiers de release

Dans le dossier `releases/`:
- `Keur-Ya-Aicha-linux-x64.AppImage`
- `Keur-Ya-Aicha-win-unpacked.zip`
- `SHA256SUMS.txt`
- Scripts Linux:
  - `run-kya-ubuntu.sh`
  - `install-kya-linux.sh`
  - `setup-integration-linux.sh`
  - `installer-un-clic-linux.sh`
  - `uninstall-kya-linux.sh`
- Scripts Windows:
  - `setup-integration-windows.bat`
  - `setup-integration-windows.ps1`
  - `install-kya-windows.ps1`
  - `uninstall-kya-windows.ps1`

## 2) Verification integrite (obligatoire recommandee)

Depuis la racine du projet:

```bash
cd /home/pmt/KeurYaAicha/kya/frontend
sha256sum -c releases/SHA256SUMS.txt
```

Resultat attendu:
- `OK` sur `Keur-Ya-Aicha-linux-x64.AppImage`
- `OK` sur `Keur-Ya-Aicha-win-unpacked.zip`

## 3) Installation Linux (complete)

### 3.1 Prerequis

- Distribution Linux x64
- Acces terminal
- Droits sudo uniquement si installation systeme (`--system`)

### 3.2 Methode recommandee (installation utilisateur + menu)

```bash
cd /home/pmt/KeurYaAicha/kya/frontend/releases
chmod +x install-kya-linux.sh uninstall-kya-linux.sh
./install-kya-linux.sh
```

Ce que le script installe (scope utilisateur):
- AppImage dans `~/.local/share/KeurYaAicha/`
- Commande `keur-ya-aicha` dans `~/.local/bin/`
- Entree menu `.desktop` dans `~/.local/share/applications/`
- Icone dans `~/.local/share/icons/hicolor/512x512/apps/`

Le script lance ensuite l'application automatiquement (sauf `--no-run`).

### 3.3 Options Linux importantes

- Installer sans lancer:

```bash
./install-kya-linux.sh --no-run
```

- Installation systeme (tous utilisateurs):

```bash
./install-kya-linux.sh --system
```

- Installer une autre AppImage:

```bash
./install-kya-linux.sh --appimage /chemin/mon-fichier.AppImage
```

### 3.4 Mode "lancement direct Ubuntu" (sans installation menu)

```bash
cd /home/pmt/KeurYaAicha/kya/frontend/releases
chmod +x Keur-Ya-Aicha-linux-x64.AppImage run-kya-ubuntu.sh
./run-kya-ubuntu.sh
```

Ce script:
- extrait l'AppImage dans `.kya-appimage-root`
- re-extrait automatiquement si l'AppImage change
- applique des options de compatibilite (sandbox/GPU)

### 3.5 Integration automatique avec AppImageLauncher (optionnel)

```bash
cd /home/pmt/KeurYaAicha/kya/frontend/releases
chmod +x setup-integration-linux.sh
./setup-integration-linux.sh
```

Comportement:
- si AppImageLauncher est disponible: integration via AppImageLauncher
- sinon: tentative d'installation AppImageLauncher
- si echec: fallback vers `installer-un-clic-linux.sh`

### 3.6 Verification post-install Linux

- Lancement via menu: rechercher `Keur Ya Aicha`
- Lancement via terminal:

```bash
keur-ya-aicha
```

Si commande introuvable, ajouter `~/.local/bin` au `PATH`.

### 3.7 Desinstallation Linux

- Scope utilisateur:

```bash
cd /home/pmt/KeurYaAicha/kya/frontend/releases
./uninstall-kya-linux.sh
```

- Scope systeme:

```bash
cd /home/pmt/KeurYaAicha/kya/frontend/releases
./uninstall-kya-linux.sh --system
```

### 3.8 Mise a jour Linux

1. Remplacer `Keur-Ya-Aicha-linux-x64.AppImage` dans `releases/`
2. Relancer:

```bash
./install-kya-linux.sh
```

Le lanceur detecte le changement et met a jour l'extraction cache automatiquement.

## 4) Installation Windows (complete)

### 4.1 Prerequis

- Windows 10/11 x64
- PowerShell disponible
- Droits admin uniquement pour installation machine (`-Scope Machine`)

### 4.2 Methode recommandee (double-clic)

Depuis `releases/`, double-cliquer:
- `setup-integration-windows.bat`

Ce script appelle:
- `setup-integration-windows.ps1`
- puis `install-kya-windows.ps1`

### 4.3 Methode PowerShell explicite

```powershell
cd C:\chemin\vers\releases
powershell -NoProfile -ExecutionPolicy Bypass -File .\setup-integration-windows.ps1
```

### 4.4 Ce que l'installation Windows fait

- Extrait `Keur-Ya-Aicha-win-unpacked.zip`
- Copie l'app dans:
  - utilisateur: `%LOCALAPPDATA%\KeurYaAicha\app`
  - machine: `%ProgramFiles%\KeurYaAicha\app`
- Cree raccourci menu demarrer `Keur Ya Aicha.lnk`
- Cree raccourci bureau (sauf `-NoDesktopShortcut`)
- Cree un manifeste d'installation:
  - utilisateur: `%LOCALAPPDATA%\KeurYaAicha\install.json`
  - machine: `%ProgramFiles%\KeurYaAicha\install.json`
- Lance l'application (sauf `-NoRun`)

### 4.5 Options Windows importantes

- Scope machine (admin):

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\setup-integration-windows.ps1 -Scope Machine
```

- Installer sans lancer:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\setup-integration-windows.ps1 -NoRun
```

- Installer sans raccourci bureau:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\setup-integration-windows.ps1 -NoDesktopShortcut
```

### 4.6 Lancement manuel apres installation

- Scope utilisateur:

```powershell
Start-Process "$env:LOCALAPPDATA\KeurYaAicha\app\Keur Ya Aicha.exe"
```

- Scope machine:

```powershell
Start-Process "$env:ProgramFiles\KeurYaAicha\app\Keur Ya Aicha.exe"
```

### 4.7 Installation Windows manuelle (sans scripts)

```powershell
cd C:\chemin\vers\releases
Expand-Archive .\Keur-Ya-Aicha-win-unpacked.zip -DestinationPath .\Keur-Ya-Aicha-win -Force
.\Keur-Ya-Aicha-win\Keur Ya Aicha.exe
```

### 4.8 Desinstallation Windows

- Scope utilisateur:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\uninstall-kya-windows.ps1
```

- Scope machine:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\uninstall-kya-windows.ps1 -Scope Machine
```

Cela supprime:
- dossier d'installation
- raccourci menu demarrer
- raccourci bureau

### 4.9 Mise a jour Windows

1. Remplacer `Keur-Ya-Aicha-win-unpacked.zip` dans `releases/`
2. Relancer:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\setup-integration-windows.ps1
```

Le script remplace le dossier `app` par la nouvelle version.

## 5) Depannage rapide

### Linux
- `Permission denied`:
  - appliquer `chmod +x` sur les scripts et l'AppImage.
- Commande `keur-ya-aicha` introuvable:
  - ajouter `~/.local/bin` au `PATH`, puis ouvrir un nouveau terminal.
- Ecran noir / plantage GPU:
  - utiliser `run-kya-ubuntu.sh` (profil compatibilite force).

### Windows
- "Execution of scripts is disabled":
  - lancer avec `-ExecutionPolicy Bypass` comme dans les commandes ci-dessus.
- SmartScreen/Defender bloque:
  - valider "Informations complementaires" puis "Executer quand meme" si source de confiance.
- App ne se lance pas apres install:
  - verifier l'exe dans `%LOCALAPPDATA%\KeurYaAicha\app\`.

## 6) Notes importantes

- Le package Windows fourni ici est un `win-unpacked.zip` (portable installe via script).
- Si vous voulez un installateur NSIS `Setup.exe`, il faut une chaine de build Windows-compatible (Wine/NSIS/reseau) lors de la generation.
- Les scripts du dossier `releases/` sont la reference officielle d'installation pour ces artefacts.
