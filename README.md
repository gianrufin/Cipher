# Cipher

Cipher is a mobile-first social deduction word game for 4 to 16 players. Citizens receive the same familiar word. Imposters must blend in with either a related decoy word or only the category. Everyone gives clues, debates, and votes before the hidden team takes control.

The interface uses a playful Mystery Zine visual system: evidence cards, taped notes, coded diagrams, red thread, expressive colors, a paper-based light theme, and a true-black dark theme.

## Ways to play

### Pass and play

The complete game runs on one phone. Players add names and take one temporary selfie each, then pass the phone for private role reveals and silent ballots. The app works offline after it has been installed as a PWA.

### Live room beta

A host creates a six-character room and shares its invite link. Players join from their own phones, add a name and temporary selfie, and receive a private voting dashboard. Ballots travel directly between browsers over WebRTC. A small Cloudflare Worker only introduces peers and does not receive game photos or ballots.

Live rooms currently act as a synchronized private-ballot companion. The host still runs role assignment, clues, powers, ejections, scoring, and rematches through Pass and Play.

## Match flow

1. Choose Pass and Play or Live Room.
2. Add players one at a time. Four players are required. Cipher shows how many more are needed.
3. Take one selfie for each player. Photos remain only in memory for the active group and are reused for rematches. They are never written to the gallery or browser storage, and disappear when the group ends or the page closes.
4. Configure the game through the five-page setup flow: Players, Game Style, Roles, Word Vault, and Review.
5. Pass the phone. Each player holds the privacy shield to see their role and word.
6. Give one useful but not obvious clue in the shown speaking order.
7. Debate and vote. The game supports open pointing or silent ballots.
8. Resolve the ejection and any role counter-actions.
9. Continue clue rounds until a team or wildcard satisfies its win condition.
10. Review match points, career standings, and downloadable social share cards.

## Teams and roles

| Role | Team | Information | Objective |
|---|---|---|---|
| Citizen | Citizens | True word | Find every Imposter |
| Decoy Citizen | Citizens | Related alternate word | Help Citizens despite receiving different information |
| Inspector | Citizens | True word plus private radar intel | Guide deductions without being identified |
| Bodyguard | Citizens | True word and one Pardon | Cancel one Citizen-team ejection |
| Imposter | Imposters | Decoy word or category only | Survive until the hostile bloc equals the Citizen team |
| Sleeper Agent | Imposter ally | True word, but no Imposter identities | Disrupt deductions and help the Imposters |
| Anarchist | Neutral | True word | Be the first player ejected in a vote |

Special roles unlock at seven players. The setup validates the cast so at least two standard Citizens remain. Recommended large-group configurations and a selectable Decoy count are included.

## Win conditions and counter-play

- Citizens win after every Imposter is ejected and the final counter-play fails.
- Imposters win when the living Imposter bloc equals or outnumbers the living Citizen team.
- The Anarchist wins alone when ejected in the first slot of a vote.
- When the last Imposter is caught, that Imposter may need to identify the Inspector, then receives one Last Stand guess at the Citizen word. A correct word steals the win.
- The Bodyguard may spend a one-time Pardon on an innocent target. If a double-ejection queue exists, the next target still resolves.

## Voting rules

Cipher includes three quick presets:

- Party: open accusation, confirmation on, skip allowed, one ejection.
- Detective: silent ballot, identities classified, skip allowed, one ejection.
- Speed: silent ballot, confirmation on, no skips, double ejection in large groups.

Every option can also be changed individually.

Open Accusation provides a 3-2-1 simultaneous pointing timer, then lets the table lock a headshot-based ejection queue. Silent Ballot passes one private ballot to each active player. Players cannot vote for themselves.

- If at least half of silent voters skip, nobody is ejected.
- A candidate needs at least two votes to be ejected.
- A tie at the ejection cutoff creates one silent runoff among tied candidates.
- If the runoff is still tied, the unresolved slot stays empty. Any already secured higher-ranked ejection still resolves.
- With Double Ejection, targets resolve in ranked order and the match may finish before the second reveal.

Ejection Information can be set to Confirmation On or Keep Classified. Confirmation displays “Name was an Imposter” or “Name was not an Imposter,” followed by the number of Imposters remaining. Classified mode shows only that the player was ejected. Private counter-actions remain shielded. An Anarchist solo win is always revealed because it ends the match.

## Words and difficulty

Built-in words are intentionally common and concrete. Difficulty measures how close the two ideas are, not how obscure the vocabulary is.

- Easy: broad, familiar pairs suitable for kids and mixed-age groups.
- Standard: everyday concepts with more overlap.
- Tricky: closely related familiar ideas that require precise clues.

Audience filters include Family, Barkada, and Mixed. Pinoy Everyday includes familiar Philippine food, transport, celebrations, places, and activities. Custom pairs and inside jokes can be added on the device. Cipher avoids repeating a recently played pair until the available pack has cycled.

## Scores, rematches, and sharing

Match Points reward team wins, survival, catches, successful protection, special objectives, and counter-play. Career totals and streaks persist locally in the browser. Restart with New Words preserves the same players, selfies, settings, and completed-game statistics while assigning fresh words and roles. Editing setup also keeps the current group photos in memory. A full data reset requires confirmation.

The result Share Studio exports Story or Feed PNG cards in Victory and Leaderboard designs. The transparent Overlay variation uses white text with a subtle shadow so it can be placed over a photo in Instagram Stories or another editor.

## Privacy

- Selfies are kept in React memory as data URLs and are not saved to localStorage, IndexedDB, the device gallery, or the signaling service.
- Rematches reuse the in-memory images to avoid repeated camera setup.
- Ending the group, reloading, closing the tab, or clearing the game drops those images.
- Pass and Play needs no account or backend.
- Live-room profiles and votes use WebRTC data channels. The signaling Worker relays only temporary connection descriptions.
- Room state is memory-only and disappears after clients disconnect.

## Local development

Requires Node.js 20 or newer.

```bash
npm install
npm run dev
npm run lint
npm run build
npm run preview
```

Copy `.env.example` to `.env.local` to enable Live Rooms during development.

## Deploy the web app to GitHub Pages

The Vite base is relative and `.github/workflows/deploy.yml` builds the PWA. In the repository, open Settings, Pages, then set Source to GitHub Actions.

For Pass and Play only, no environment variable is required. For Live Rooms, first deploy the signaling Worker and add `VITE_SIGNALING_URL` as a GitHub Actions repository variable. The workflow reads it during the production build.

## Deploy the Firebase-free signaling Worker

The Worker uses Cloudflare Durable Objects and native WebSockets. It has no database and no Firebase dependency.

```bash
cd worker
npm install
npx wrangler login
npm run deploy
```

Copy the deployed HTTPS URL, for example `https://cipher-signaling.example.workers.dev`, into:

- local `.env.local`: `VITE_SIGNALING_URL=https://...`
- GitHub repository variable: Settings, Secrets and variables, Actions, Variables, `VITE_SIGNALING_URL`

The browser converts this HTTPS origin to WSS automatically. A public STUN server is configured for peer discovery. Same-Wi-Fi play generally connects directly. Some restrictive or carrier-grade networks may require a TURN relay, which is not bundled because it needs its own bandwidth service and credentials.

## Technology

React 19, TypeScript, Vite, Tailwind CSS 4, Lucide icons, Canvas Confetti, Vite PWA, WebRTC data channels, and a Cloudflare Durable Object signaling Worker.
