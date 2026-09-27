# 🏛️ Postera AI — Backend API & Rendering Engine

<div align="center">

![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg?style=for-the-badge&logo=node.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue.svg?style=for-the-badge&logo=typescript)
![Express](https://img.shields.io/badge/Express-4.21-lightgrey.svg?style=for-the-badge&logo=express)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green.svg?style=for-the-badge&logo=mongodb)
![Puppeteer](https://img.shields.io/badge/Puppeteer-1200x1600_HD-orange.svg?style=for-the-badge&logo=puppeteer)
![Google Gemini](https://img.shields.io/badge/AI-Gemini_1.5_Flash-purple.svg?style=for-the-badge&logo=google)
![Cloudinary](https://img.shields.io/badge/Cloudinary-CDN_Storage-blue.svg?style=for-the-badge&logo=cloudinary)

**Ultra-High-Resolution (1200×1600) Bangladeshi Political & Civic Poster Maker Backend with Intelligent AI Layout Director.**

</div>

---

## 📖 Overview

The **Postera AI Backend** powers dynamic Bangladeshi political and civic poster creation. It integrates Google Gemini 1.5 Flash to automatically determine typography hierarchy, color schemes, and photo balance based on occasion, candidate designation, and event details. It renders print-ready **1200×1600px HD posters** using Headless Puppeteer and stores user assets securely on Cloudinary CDN.

---

## 🚀 Key Features

- **🧠 Google Gemini 1.5 Flash Layout Director**:
  - Automatically suggests harmonious color palettes (`primary`, `secondary`, `accent`), headline alignments, photo arrangement (hero, dual, pyramid), and stylistic elements.
  - Tailored specifically for Bangladeshi cultural & political aesthetics.

- **🖨️ Headless Puppeteer HD Rendering Engine**:
  - Generates crisp 1200×1600px print-ready PNG posters.
  - Renders authentic SVG cultural motifs:
    - 🇧🇩 **Victory Day / National Days**: Red Sun, National Martyrs' Memorial (*Jatiya Smriti Soudho*) silhouette, golden laurel borders.
    - 🗳️ **Election Campaigns**: Royal Navy & Gold crests, ballot box symbol badges, candidate frame seals.
    - 🌙 **Eid Mubarak**: Ornate crescent moon & star, Islamic arches, minarets, and hanging lanterns (*fanus*).
    - 🕯️ **Condolence / Mourning**: Somber charcoal/silver palette, candle flame, mourning ribbon emblem.
    - 🏆 **Congratulations & Greetings**: Purple/gold celebration sparkles, 5-star badges, honor laurels.
    - 📢 **Conference & Rallies**: Rally megaphones, date/venue schedule badges, bold typography.
  - Full native Bengali typography support (`Hind Siliguri`, `Noto Serif Bengali`).

- **☁️ Cloudinary Cloud Asset Pipeline**:
  - Fast portrait uploads with Multer memory storage.
  - Direct server-side upload of generated HD poster images.

- **🛡️ Enterprise Security & Access Control**:
  - JWT Authentication with password hashing via bcryptjs.
  - Role-based authorization (`user`, `admin`).
  - Rate limiting on generation endpoints (`express-rate-limit`).
  - Permissive CORS for seamless local and production frontend integration.

- **🌱 Database Seeder**:
  - One-command seed script (`npm run seed`) pre-populates MongoDB Atlas with 6 production-grade Bangladeshi poster templates.

---

## 📁 Project Architecture

```
Backend/
├── .env                  # Environment secrets & connection keys
├── .gitignore            # Git exclusion rules
├── admin.ts              # Admin dashboard metrics & template management
├── auth.ts               # Registration, Login, JWT verification middleware
├── gemini.ts             # Google Gemini 1.5 Flash prompt & layout director
├── index.ts              # Express application bootstrap & route mounting
├── models.ts             # Mongoose schemas (User, PosterTemplate, UserPoster)
├── poster.ts             # Poster creation, regeneration, user gallery APIs
├── render.ts             # Headless Puppeteer 1200x1600 HTML-to-Image engine
├── seed.ts               # Database seeder for authentic Bangladeshi templates
├── template.ts           # Public template discovery & categorization APIs
├── tsconfig.json         # TypeScript configuration (outDir: ./dist)
├── upload.ts             # Multer & Cloudinary image upload route
└── dist/                 # Clean compiled production JavaScript
```

---

## 🛠️ Tech Stack & Dependencies

| Category | Technology |
|---|---|
| **Runtime** | Node.js (v18 or higher) |
| **Language** | TypeScript (v5.6.3) |
| **Framework** | Express.js (v4.21.0) |
| **Database** | MongoDB Atlas with Mongoose (v8.7.0) |
| **AI Engine** | Google Generative AI SDK (`gemini-1.5-flash`) |
| **Rendering** | Puppeteer (v23.5.0) |
| **Storage** | Cloudinary (v2.5.1) + Multer (v1.4.5) |
| **Auth** | JSON Web Tokens (`jsonwebtoken`) + `bcryptjs` |

---

## ⚙️ Environment Configuration

Create a `.env` file in the `Backend/` directory with the following variables:

```env
# Server Port
PORT=5000

# MongoDB Database Connection
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/Postera-AI?appName=Cluster1

# JSON Web Token Secret
JWT_SECRET=your_super_secret_jwt_key_here

# Cloudinary CDN Credentials
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Google Gemini API
GEMINI_API_KEY=your_google_gemini_api_key
```

> **Note**: Backend does not require any frontend URL. The CORS configuration uses `origin: true`, automatically reflecting incoming requests from any client port or domain.

---

## 🚦 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Seed Default Poster Templates
Run this command once to seed MongoDB with all 6 authentic Bangladeshi templates:
```bash
npm run seed
```

### 3. Start Development Server
Starts the server with automatic restart on file change using `ts-node-dev`:
```bash
npm run dev
```
Server will start at `http://localhost:5000`.

### 4. Build for Production
Compiles TypeScript into clean JavaScript inside the `dist/` directory:
```bash
npm run build
npm start
```

---

## 📡 API Reference

### 🔐 Authentication (`/api/auth`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Register new user (`name`, `email`, `password`) |
| `POST` | `/api/auth/login` | Public | Login & receive JWT token |
| `GET` | `/api/auth/me` | Authenticated | Retrieve current authenticated user profile |

### 🖼️ Templates (`/api/templates`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/templates` | Public | List all active templates (supports `?category=...`) |
| `GET` | `/api/templates/:id` | Public | Get single template by MongoDB `_id`, slug, or numeric index |

### 🎨 Poster Generation & Management (`/api/posters`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/posters` | Authenticated | Generate poster (triggers Gemini AI + Puppeteer rendering) |
| `GET` | `/api/posters/user/me` | Authenticated | List all posters created by the current user |
| `GET` | `/api/posters/:id` | Authenticated | Retrieve specific poster details & HD Cloudinary URL |
| `POST` | `/api/posters/:id/regenerate` | Authenticated | Re-render existing poster with new edits or slogans |
| `DELETE` | `/api/posters/:id` | Authenticated | Delete a poster from user account |

#### Poster Generation Payload Example (`POST /api/posters`):
```json
{
  "templateId": "victory-day",
  "occasion": "victoryDay",
  "name": "মোহাম্মদ রফিকুল ইসলাম",
  "designation": "সাধারণ সম্পাদক",
  "party": "বাংলাদেশ জাতীয়তাবাদী দল",
  "district": "ঢাকা উত্তর",
  "slogan": "১৬ই ডিসেম্বর মহান বিজয় দিবস সফল হোক",
  "customMessage": "বীর শহীদদের প্রতি বিনম্র শ্রদ্ধাঞ্জলি",
  "photos": [
    "https://res.cloudinary.com/demo/image/upload/sample.jpg"
  ],
  "templateStyle": "occasion"
}
```

### 📤 Upload (`/api/upload`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/upload` | Authenticated | Upload portrait photo (multipart/form-data `file`) to Cloudinary |

### 👑 Admin Management (`/api/admin`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/admin/stats` | Admin Only | Global metrics: total users, posters generated, active templates |
| `GET` | `/api/admin/templates` | Admin Only | Full template catalogue with system stats |
| `POST` | `/api/admin/templates` | Admin Only | Create a new poster template |
| `PATCH` | `/api/admin/templates/:id` | Admin Only | Toggle active status or update template metadata |
| `DELETE` | `/api/admin/templates/:id` | Admin Only | Delete template |
| `GET` | `/api/admin/posters` | Admin Only | List all generated posters across all users |
| `PATCH` | `/api/admin/posters/:id/flag` | Admin Only | Flag or unflag a poster for content review |

---

## 🎨 Supported Occasions & Templates

| Occasion Key | Display Title (বাংলা) | Theme | Default Visual Motifs |
|---|---|---|---|
| `victoryDay` | মহান বিজয় দিবস | Emerald & Crimson | Red Sun, National Martyrs' Memorial, Laurel Wreath |
| `campaign` | নির্বাচনী প্রচার ও সমাবেশ | Navy & Gold | Gold Ballot Badge, Candidate Portrait Crest |
| `eid` | পবিত্র ঈদ মোবারক | Islamic Green & Gold | Golden Crescent, Mosque Domes, Fanus Lanterns |
| `condolence` | গভীর শোক ও শ্রদ্ধাঞ্জলি | Slate & Silver | Mourning Ribbon, Candle Glow, Minimal Elegance |
| `greeting` | শুভেচ্ছা ও অভিনন্দন | Royal Violet & Gold | 5-Star Honor Seal, Gold Confetti, Victory Laurels |
| `conference` | প্রতিনিধি সম্মেলন ও কাউন্সিল | Crimson & Green | Conference Megaphone, Venue & Date Badge |

---

## 🛡️ License

MIT License. Developed for **Postera AI (Rise Together)**.
