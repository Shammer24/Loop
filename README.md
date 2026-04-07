# Loop PWA

This package converts the Loop MVP into a Progressive Web App.

## What was added
- Installable web app (`manifest.webmanifest`)
- Offline cache (`sw.js`)
- Home-screen support for iPhone/Android
- App icons
- Install banner

## How to publish
Upload these files to GitHub Pages or any static host.

### GitHub Pages
1. Create a repo
2. Upload all files in this folder
3. Settings -> Pages -> Deploy from branch -> `main` -> `/(root)`
4. Open your live URL in Safari
5. Tap Share -> Add to Home Screen

## Local preview
```bash
python3 -m http.server 8000
```
Then open:
`http://localhost:8000/`
