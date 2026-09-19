# Huzbi's Cozy 2 AM Digital Room // Portfolio

> A sensory, tactile, and interactive digital room portfolio for **Huzefa Saifuddin (Huzbi)** — FAST NU CS Graduate, low-level systems & multi-agent enthusiast, and avid manga reader.

---

## ✨ Features

- **Cozy 2 AM Digital Room**:
  - Interactive retro CRT monitor with multiple operational modes (`IDLE`, `GITHUB`, `PROJECTS`, `TERMINAL`).
  - Pixel character with breathing, blinking, and mouse tracking animations.
  - Interactive desk lamp toggling ambient warm night lighting.
  - Manga shelf featuring Huzbi's favorites (*One Piece*, *Naruto*, *Bleach*, *Black Clover*, *One Punch Man*) with authentic commentary.
  - Starry night window overlooking the quiet city skyline.
- **Physical Project Artifacts**:
  - Projects rendered as tangible retro artifacts (ROM game cartridges, mini terminals, network circuit boards, and neural machine units).
  - Detailed modal view with technical deep-dives, architecture diagrams, and repository shortcuts.
- **StarCluster Constellation Graph**:
  - Interactive SVG constellation mapping out Huzbi's GitHub repositories, topic clusters, star metrics, and language nodes.
- **Interactive Retro Shell (`HuzbiSH`)**:
  - Accessible via the CRT monitor, navigation bar, or pressing \`~\` / hotkeys.
  - Supports commands: \`help\`, \`projects\`, \`manga\`, \`cat about\`, \`cat contact\`, \`neofetch\`, \`theme\`, \`whoami\`, \`clear\`, and more.
- **Three Aesthetic Themes & CRT Shader**:
  - **Cozy CRT** (Deep obsidian, CRT glow, soft emerald & warm amber)
  - **Warm Apartment** (Cozy charcoal, terracotta, warm cream & sage)
  - **Moonlit Terminal** (Night sky blue, electric cyan & lavender)
  - Toggleable vintage CRT scanlines and screen glow.
- **100% Static & Zero-Backend**:
  - Exported cleanly to static HTML/CSS/JS via Next.js \`output: 'export'\`.
  - Client-side fallback caching for GitHub API with zero runtime server dependency.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router, Static HTML Export)
- **Language**: TypeScript (Strict mode)
- **Styling**: Tailwind CSS v3 with CSS custom properties & retro pixel utilities
- **Package Manager**: pnpm
- **Icons**: Lucide React + custom pixel/brand SVGs
- **Deployment**: GitHub Pages / Static hosting

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- pnpm (\`npm install -g pnpm\`)

### Installation & Development

```bash
# Clone the repository
git clone https://github.com/Huzbi-crypto/Huzefa-Portfolio.git
cd Huzefa-Portfolio

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
# Type check & build static export
pnpm build
```

The compiled static site will be generated in the `out/` directory ready for deployment to GitHub Pages or any static CDN.

---

## 📬 Contact

- **Email**: [xhuzbi@proton.me](mailto:xhuzbi@proton.me)
- **GitHub**: [@Huzbi-crypto](https://github.com/Huzbi-crypto)
- **Twitter / X**: [@HuzbiC](https://twitter.com/HuzbiC)
- **LinkedIn**: [Huzefa Saifuddin](https://linkedin.com/in/huzefa-saifuddin)

---

## 📄 License

MIT © [Huzefa Saifuddin](LICENSE)
