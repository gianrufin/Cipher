# Cipher: Social Deduction (1-Phone Party Game)

**Cipher** is a mobile-first, face-to-face social deduction party game designed for **3 to 16 players using just a single phone**. No app installations, no accounts, and no complex setup required.

---

## 🚀 How to Host on GitHub Pages

This project is pre-configured with **relative asset paths** (`base: './'`) and an **automated GitHub Actions deployment workflow** (`.github/workflows/deploy.yml`).

### Step 1: Push the Code to GitHub
1. Create a new repository on [GitHub](https://github.com/new).
2. Push your project files to the `main` (or `master`) branch:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Cipher Social Deduction Game"
   git branch -M main
   git remote add origin https://github.com/<YOUR_USERNAME>/<YOUR_REPOSITORY>.git
   git push -u origin main
   ```

### Step 2: Enable GitHub Pages via GitHub Actions
1. In your GitHub repository, click **Settings** (gear icon at the top).
2. In the left sidebar, click **Pages** (under the "Code and automation" section).
3. Under **Build and deployment** > **Source**, select **GitHub Actions** from the dropdown menu (instead of "Deploy from a branch").
4. That's it! The pre-configured `.github/workflows/deploy.yml` workflow will automatically run.
5. In 1–2 minutes, your live game URL will appear at:
   ```
   https://<YOUR_USERNAME>.github.io/<YOUR_REPOSITORY>/
   ```

---

## 🕹️ Game Features

- **Single-Phone Circle Play**: Pass the phone around the circle; each player secretly checks their role.
- **Hold-to-Reveal Privacy Shield**: Requires holding the screen down to reveal secret identities, guarding against shoulder peeking.
- **Decoy Word Innovation**: Imposters don't just stay silent—they receive a believable decoy word (*e.g., "Espresso" vs. "Latte"*) or play in Blind Phantom mode!
- **Interactive Onboarding Tutorial**: Interactive practice drill teaches new players the mechanics in under 60 seconds.
- **Dynamic Clue Round**: Guided speaking order with an optional built-in timer and wild round modifiers.
- **The Imposter's Last Stand**: Even when voted out, an unmasked imposter gets one final guess to steal victory.
- **Game Stats & Analytics**: Tracks rounds played, imposters caught, win percentages, and match histories.
- **Progressive Web App (PWA) & Offline First**: Fully installable to iPhone and Android home screens with fullscreen display and zero internet dependency after initial load.
- **Custom Word Packs**: Add custom inside jokes, word pairs, and local themes saved directly in browser storage.
- **Large Lobby Roles**: At 7+ players, unlock the Inspector, Bodyguard, Sleeper Agent, and Anarchist with real counter-phases, veto logic, and independent win conditions.
- **Recommended Casts**: Apply balanced 7–8 and 9–12 player configurations from the setup screen in one tap.

---

## 💻 Local Development

```bash
# Install dependencies
npm install

# Start local development server (port 3000)
npm run dev

# Build production bundle
npm run build

# Preview production build locally
npm run preview
```
