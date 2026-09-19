# Kumbh Mela Visitor Survey

> A lightweight, multilingual visitor survey application built with TanStack Start, React, and Tailwind CSS. Designed to collect pilgrim feedback with both text and voice capabilities in English, Hindi, and Marathi.

---

## ✨ Features

- **🌐 Multilingual Support**: Fully localized in 3 languages:
  - English (`en-IN`)
  - Hindi (`hi-IN` · हिन्दी)
  - Marathi (`mr-IN` · मराठी)
- **🎙️ Voice & Audio Input**:
  - **Speech-to-Text**: Real-time voice typing powered by the Web Speech API.
  - **Audio Recording**: Record voice responses directly in the browser via `MediaRecorder`.
- **📋 Guided Questionnaire**: Step-by-step survey flow with progress tracking, rating scales, multiple-choice options, and open feedback fields covering crowd management, medical care, safety, sanitation, and travel.
- **📊 Admin Dashboard (`/admin`)**: Built-in review dashboard to browse submitted responses and play back recorded audio answers.
- **💾 Local Persistence**: Client-side storage for responses via `localStorage`, enabling instant review and offline-friendly data collection.

---

## 🛠️ Tech Stack

- **Framework**: [TanStack Start](https://tanstack.com/start) & [React 19](https://react.dev)
- **Routing**: [TanStack Router](https://tanstack.com/router) (file-based routing)
- **Language**: TypeScript
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com) & [Radix UI](https://www.radix-ui.com)
- **Icons**: [Lucide React](https://lucide.dev)
- **Build Tool**: [Vite](https://vite.dev)

---

## 🚀 Getting Started

### Prerequisites

Ensure you have [Node.js](https://nodejs.org/) (v20+) or [Bun](https://bun.sh/) installed.

### Installation

Clone the repository and install dependencies:

```bash
# Using npm
npm install

# Or using bun
bun install
```

### Environment Configuration

Copy the sample environment file and configure your credentials:

```bash
cp .env.example .env
```

Configure your credentials in `.env`:
- **Firebase**: For storing survey responses in Firestore
- **AWS S3**: For uploading recorded audio answers and media attachments


### Running Locally

Start the local development server:

```bash
npm run dev
# or
bun dev
```

Open your browser and navigate to:
- **Survey App**: [http://localhost:3000](http://localhost:3000) (or the port indicated in your terminal)
- **Admin View**: [http://localhost:3000/admin](http://localhost:3000/admin)

---

## 📜 Available Scripts

| Script | Command | Description |
| --- | --- | --- |
| Development | `npm run dev` | Starts Vite dev server with hot reload |
| Production Build | `npm run build` | Compiles the project for production |
| Preview | `npm run preview` | Previews the production build locally |
| Lint | `npm run lint` | Runs ESLint to identify code issues |
| Format | `npm run format` | Formats source files with Prettier |

---

## 📁 Project Structure

```text
kumbha-mela-survey/
├── public/              # Static assets and icons
├── src/
│   ├── components/      # UI components (VoiceInput, Radix UI components)
│   ├── lib/
│   │   └── survey.ts    # Survey schema, questions, translations, storage helpers
│   ├── routes/          # TanStack Start file-based routes
│   │   ├── __root.tsx   # Root application layout
│   │   ├── index.tsx    # Visitor survey questionnaire (/)
│   │   └── admin.tsx    # Admin response viewer (/admin)
│   ├── router.tsx       # Router configuration
│   └── styles.css       # Tailwind CSS and global styling
├── package.json
└── vite.config.ts
```

---

## 🎙️ Browser Capabilities & Permissions

- **Voice Typing**: Utilizes the Web Speech API (`SpeechRecognition` / `webkitSpeechRecognition`). Best supported on Chromium-based browsers (Chrome, Edge, Brave).
- **Audio Recording**: Uses the HTML5 `MediaRecorder` API. Requires granting microphone access when prompted by the browser.
