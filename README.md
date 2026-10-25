# 🕉️ Kumbh Mela Visitor Survey

 A modern, multilingual digital survey application designed to collect and analyze pilgrim feedback for the Kumbh Mela — capturing visitor experiences to improve infrastructure, crowd management, and facilities.

---

## ✨ Key Features

### Pilgrim Survey (`/`)
- 🌐 **Multilingual Support**: Fully translated in **English**, **हिन्दी (Hindi)**, and **मराठी (Marathi)**.
- 🎙️ **Voice Typing & Audio Recording**: Integrated Web Speech recognition for voice dictation and in-browser audio recording (Opus/WebM).
- 📸 **Media Uploads**: Pilgrims can share experience photos and videos (with client-side image compression, up to 10MB).
- 💾 **Offline Draft Resilience**: Automatically saves progress in IndexedDB; visitors can close and resume without losing answers.
- 📍 **GPS & Quick City Selection**: Auto-detect city via geolocation or pick from quick-select pilgrimage chips.
- 📱 **Mobile-First Experience**: Optimized for smartphones with compact option layouts, WCAG-compliant touch targets (`min-h-[48px]`), smooth auto-scroll, and collapsible history.
- 🔒 **Duplicate Prevention**: Prevents repeat submissions on the same device.

### Admin Dashboard (`/admin`)
- 📊 **Real-Time KPIs**: Total responses, facility satisfaction, audio counts, and media attachments.
- 📈 **Interactive Visualizations**: Charts powered by Recharts (submission trends, ratings, language breakdown, top origin cities, past attendance).
- 🔍 **Search & Filters**: Filter by language, audio-only, media-only, or text search across responses.
- 📥 **Excel Export**: 1-click formatted `.xlsx` export containing all 21 questions and S3 media links.

---

## 📋 Questionnaire Structure

Structured into **21 questions across 5 sections** based on the research framework by K K Wagh MCA:

| Section | Focus Area | Questions |
|:---|:---|:---|
| **Section A** | **Visitor Background & Visit Details** | Name, 10-digit Phone, City, Past Kumbh attended, Companions, Group size, Primary purpose, Transport mode |
| **Section B** | **Facilities & Visitor Experience** | Facilities used, Satisfaction rating, Major challenges faced |
| **Section C** | **Crowd Management & Technology** | Duration of stay (Hours/Days/Months), Crowd rating, Tech systems observed, Tech issues faced, Desired tech features |
| **Section D** | **Information & Infrastructure** | Primary info source, Electricity & internet connectivity rating |
| **Section E** | **Impact & Future Improvements** | Overall visit impact, Photo/Video upload *(optional)*, Tech improvement suggestions *(optional)* |

---

## 🛠️ Tech Stack

- **Framework**: [TanStack Start](https://tanstack.com/start) (React 19 + Vite)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Database**: [Firebase Firestore](https://firebase.google.com/)
- **Media Storage**: [AWS S3](https://aws.amazon.com/s3/) (Mumbai `ap-south-1`)
- **Analytics & Charts**: [Recharts](https://recharts.org/)
- **Export**: [SheetJS (xlsx)](https://sheetjs.com/)
- **Media Tools**: Web Speech API, MediaRecorder API, `browser-image-compression`

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js 18+
- npm or pnpm

### 2. Installation
```bash
# Clone repository
git clone https://github.com/Shriram2005/Kumbh-Mela-Survey.git
cd Kumbh-Mela-Survey

# Install dependencies
npm install
```

### 3. Environment Variables
Create a `.env` file in the root directory (refer to `.env.example`):

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id

# AWS S3 (Audio and Media Storage)
VITE_AWS_REGION=ap-south-1
VITE_AWS_ACCESS_KEY_ID=your_access_key
VITE_AWS_SECRET_ACCESS_KEY=your_secret_key
VITE_AWS_S3_BUCKET=your_bucket_name
```
> *Note: If cloud credentials are not supplied, the app gracefully falls back to local storage.*

### 4. Run Development Server
```bash
npm run dev
```
Open **http://localhost:8080** to view the survey or **http://localhost:8080/admin** for the admin dashboard.

### 5. Build for Production
```bash
npm run build
npm run preview
```

---

## 📂 Project Structure

```
kumbha-mela-survey/
├── src/
│   ├── routes/
│   │   ├── __root.tsx        # App shell and root layout
│   │   ├── index.tsx         # Mobile-first 21-question survey flow
│   │   └── admin.tsx         # Analytics dashboard & Excel export
│   ├── components/
│   │   ├── VoiceInput.tsx    # Speech-to-text and audio recorder
│   │   └── ui/               # Radix UI + Tailwind design components
│   ├── lib/
│   │   ├── survey.ts         # Question schemas, translations (EN/HI/MR)
│   │   ├── firebase.ts       # Firestore database initialization
│   │   ├── s3.ts             # AWS S3 direct upload handler
│   │   └── draft.ts          # IndexedDB draft auto-save
│   └── styles.css            # Global styling & custom themes
├── public/                   # Static assets
├── package.json
└── vite.config.ts
```

---

## 📄 License

This project is developed for research and public service planning for Kumbh Mela events.
