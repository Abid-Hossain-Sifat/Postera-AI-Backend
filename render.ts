import puppeteer from "puppeteer";
import { v2 as cloudinary } from "cloudinary";
import https from "https";
import http from "http";
import { GeminiDesignSuggestion } from "./gemini";
import dotenv from "dotenv";
dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

interface FormData {
  name: string;
  designation?: string;
  party?: string;
  district?: string;
  unionThana?: string;
  headline?: string;
  slogan?: string;
  occasion?: string;
  templateStyle?: string;
}

const occasionBangla: Record<string, string> = {
  victoryDay: "মহান বিজয় দিবস",
  campaign: "নির্বাচনী প্রচারণা",
  condolence: "শোক ও শ্রদ্ধাঞ্জলি",
  eid: "ঈদ মোবারক",
  greetings: "শুভেচ্ছা ও অভিনন্দন",
  greeting: "শুভেচ্ছা ও অভিনন্দন",
  conference: "কর্মী সম্মেলন ও সমাবেশ",
};

const fetchBase64 = (url: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const get = url.startsWith("https") ? https.get : http.get;
    get(url, (res) => {
      const chunks: Buffer[] = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => {
        const buf = Buffer.concat(chunks);
        const ct = res.headers["content-type"] || "image/jpeg";
        resolve(`data:${ct};base64,${buf.toString("base64")}`);
      });
      res.on("error", reject);
    }).on("error", reject);
  });
};

const escapeHtml = (text?: string): string => {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

const buildPhotoComposition = (photos: string[], layoutMode: string, accentColor: string): string => {
  const count = photos.length;

  if (count === 0) {
    return `
      <div class="photo-composition zero-photo">
        <div class="emblem-shield">
          <div class="emblem-inner">
            <svg class="emblem-star" viewBox="0 0 24 24" fill="${accentColor}">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
          </div>
        </div>
      </div>
    `;
  }

  if (count === 1) {
    return `
      <div class="photo-composition hero-photo-wrap">
        <div class="hero-halo"></div>
        <div class="photo-frame-hero">
          <img src="${photos[0]}" class="poster-img" alt="Leader" />
          <div class="photo-glow-border"></div>
        </div>
      </div>
    `;
  }

  if (count === 2) {
    return `
      <div class="photo-composition dual-photo-wrap">
        <div class="dual-card primary-card">
          <div class="photo-frame-dual">
            <img src="${photos[0]}" class="poster-img" alt="Leader 1" />
          </div>
        </div>
        <div class="dual-card secondary-card">
          <div class="photo-frame-dual">
            <img src="${photos[1]}" class="poster-img" alt="Leader 2" />
          </div>
        </div>
      </div>
    `;
  }

  // 3 photos: Tiered pyramid
  return `
    <div class="photo-composition triple-photo-wrap">
      <div class="triple-top">
        <div class="triple-card leader-card">
          <div class="photo-frame-triple leader-frame">
            <img src="${photos[0]}" class="poster-img" alt="Primary Leader" />
          </div>
        </div>
      </div>
      <div class="triple-bottom">
        <div class="triple-card flank-card left-flank">
          <div class="photo-frame-triple flank-frame">
            <img src="${photos[1]}" class="poster-img" alt="Leader 2" />
          </div>
        </div>
        <div class="triple-card flank-card right-flank">
          <div class="photo-frame-triple flank-frame">
            <img src="${photos[2]}" class="poster-img" alt="Leader 3" />
          </div>
        </div>
      </div>
    </div>
  `;
};

const buildHTML = (
  formData: FormData,
  photos: string[],
  design: GeminiDesignSuggestion
): string => {
  const occasionTitle =
    occasionBangla[formData.occasion || "greetings"] || "রাজনৈতিক পোস্টার";
  const mainHeadline = escapeHtml(formData.headline || occasionTitle);
  const sloganText = escapeHtml(formData.slogan || "আপনার দোয়া ও সমর্থন প্রত্যাশী");
  const candidateName = escapeHtml(formData.name);
  const designation = escapeHtml(formData.designation);
  const party = escapeHtml(formData.party);
  const district = escapeHtml(formData.district);
  const unionThana = escapeHtml(formData.unionThana);
  const locationText = [unionThana, district].filter(Boolean).join(", ");
  const templateStyle = formData.templateStyle || design.templateStyle || "formal";
  const occ = formData.occasion || "campaign";
  let primary = design.primaryColor || "#051329";
  let secondary = design.secondaryColor || "#0b2554";
  let accent = design.accentColor || "#EAB308";
  let topBadgeText = "★ জনগণের সেবায় নিবেদিত প্রাণ ★";

  if (occ === "victoryDay") {
    primary = "#021f14";
    secondary = "#004d2c";
    accent = "#FFD700";
    topBadgeText = "★ ১৬ই ডিসেম্বর মহান বিজয় দিবস ★";
  } else if (occ === "eid") {
    primary = "#022115";
    secondary = "#05452d";
    accent = "#FDE047";
    topBadgeText = "تقبل الله منا ومنكم — পবিত্র ঈদ মোবারক";
  } else if (occ === "condolence") {
    primary = "#111827";
    secondary = "#1f2937";
    accent = "#E2E8F0";
    topBadgeText = "إِنَّا لِلَّٰهِ وَإِنَّا إِلَيْهِ رَاجِعُونَ";
  } else if (occ === "conference") {
    primary = "#1e1b4b";
    secondary = "#312e81";
    accent = "#F59E0B";
    topBadgeText = "★ ঐক্য • শৃঙ্খলা • প্রগতি ★";
  } else if (occ === "greeting" || occ === "greetings") {
    primary = "#2a0845";
    secondary = "#551270";
    accent = "#FFD54F";
    topBadgeText = "★ ★ ★ ★ ★";
  }

  const photoMarkup = buildPhotoComposition(photos, design.layout, accent);

  return `<!DOCTYPE html>
<html lang="bn">
<head>
<meta charset="UTF-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&family=Noto+Serif+Bengali:wght@600;700;800;900&display=swap" rel="stylesheet">
<style>
* { margin:0; padding:0; box-sizing:border-box; }
body {
  width:1200px; height:1600px;
  font-family:'Hind Siliguri', sans-serif;
  overflow:hidden;
  position:relative;
  background-color:${primary};
  color:#ffffff;
  -webkit-font-smoothing: antialiased;
}

/* ── Layered Rich Background ────────────────────────────────────────── */
.bg-layer-base {
  position:absolute; inset:0;
  background: radial-gradient(circle at 50% 28%, ${secondary} 0%, ${primary} 70%, #020712 100%);
  z-index: 1;
}

.bg-layer-radial-light {
  position:absolute; inset:0;
  background:
    radial-gradient(circle at 50% 20%, ${accent}22 0%, transparent 45%),
    radial-gradient(circle at 50% 65%, ${accent}14 0%, transparent 40%),
    radial-gradient(circle at 10% 90%, ${secondary}66 0%, transparent 40%),
    radial-gradient(circle at 90% 10%, ${secondary}66 0%, transparent 40%);
  z-index: 2;
}

.bg-layer-rays {
  position:absolute; inset:0;
  opacity:0.04;
  background: repeating-conic-gradient(from 0deg, #ffffff 0deg 4deg, transparent 4deg 12deg);
  z-index: 3;
  pointer-events:none;
}

.bg-vignette {
  position:absolute; inset:0;
  box-shadow: inset 0 0 160px rgba(0,0,0,0.85);
  z-index: 4;
}

/* ── Ornate Frame & Geometric Borders ────────────────────────────────── */
.outer-border {
  position:absolute; inset:24px;
  border: 3px solid ${accent}99;
  border-radius: 20px;
  box-shadow: 0 0 35px ${accent}26;
  z-index: 10;
  pointer-events:none;
}
.inner-border {
  position:absolute; inset:34px;
  border: 1px dashed ${accent}55;
  border-radius: 14px;
  z-index: 10;
  pointer-events:none;
}

/* Corner Ornaments */
.corner-filigree {
  position:absolute; width:44px; height:44px;
  border-color:${accent};
  border-style:solid;
  z-index: 12;
}
.corner-tl { top:34px; left:34px; border-width:4px 0 0 4px; border-top-left-radius:8px; }
.corner-tr { top:34px; right:34px; border-width:4px 4px 0 0; border-top-right-radius:8px; }
.corner-bl { bottom:34px; left:34px; border-width:0 0 4px 4px; border-bottom-left-radius:8px; }
.corner-br { bottom:34px; right:34px; border-width:0 4px 4px 0; border-bottom-right-radius:8px; }

/* ── Poster Canvas Layout ───────────────────────────────────────────── */
.canvas-wrapper {
  position:relative; z-index:20;
  width:100%; height:100%;
  display:flex; flex-direction:column;
  justify-content:space-between;
  padding: 65px 75px 0 75px;
}

/* ── Top Header Section ─────────────────────────────────────────────── */
.header-area {
  display:flex; flex-direction:column;
  align-items:center; text-align:center;
  margin-bottom: 20px;
}

.occasion-pill-badge {
  display:inline-flex; align-items:center; gap:8px;
  background: linear-gradient(135deg, ${accent}28, ${secondary}dd);
  border: 1.5px solid ${accent};
  border-radius: 30px;
  padding: 7px 28px;
  margin-bottom: 16px;
  box-shadow: 0 4px 18px rgba(0,0,0,0.4);
}
.occasion-pill-text {
  font-family:'Hind Siliguri', sans-serif;
  font-size:22px; font-weight:700;
  color:${accent}; letter-spacing:1px;
}
.badge-star { font-size:16px; color:${accent}; }

.main-headline-box {
  position:relative; width:100%;
  display:flex; justify-content:center;
  margin-bottom: 10px;
}
.main-headline {
  font-family:'Noto Serif Bengali', serif;
  font-size: 72px; font-weight: 900;
  line-height: 1.18;
  color: #ffffff;
  text-align:center;
  text-shadow:
    0 4px 20px rgba(0,0,0,0.8),
    0 0 30px ${accent}44;
  letter-spacing: 1px;
}
.main-headline span.gold-highlight {
  color: ${accent};
}

.header-accent-divider {
  display:flex; align-items:center; justify-content:center;
  gap:14px; width:75%; margin: 12px auto 0;
}
.divider-line {
  flex:1; height:2px;
  background: linear-gradient(90deg, transparent, ${accent}, transparent);
}
.divider-diamond {
  width:10px; height:10px;
  background: ${accent};
  transform: rotate(45deg);
  box-shadow: 0 0 10px ${accent};
}

/* ── Dynamic Photo Composition Area ─────────────────────────────────── */
.photo-composition {
  position:relative;
  display:flex; justify-content:center; align-items:center;
  margin: 10px 0 20px 0;
  min-height: 480px;
}

.poster-img {
  width:100%; height:100%;
  object-fit:cover;
  object-position:top center;
  display:block;
}

/* 1 Photo: Hero Composition */
.hero-photo-wrap {
  position:relative;
}
.hero-halo {
  position:absolute; width:460px; height:540px;
  background: radial-gradient(circle, ${accent}33 0%, transparent 70%);
  top:50%; left:50%; transform:translate(-50%, -50%);
  border-radius:50%;
  filter: blur(20px);
  z-index:1;
}
.photo-frame-hero {
  position:relative; z-index:2;
  width: 390px; height: 490px;
  border-radius: 195px 195px 28px 28px;
  border: 6px solid ${accent};
  overflow:hidden;
  box-shadow:
    0 16px 45px rgba(0,0,0,0.7),
    0 0 40px ${accent}44;
  background: ${secondary};
}
.photo-glow-border {
  position:absolute; inset:6px;
  border: 2px solid rgba(255,255,255,0.3);
  border-radius: 189px 189px 22px 22px;
  pointer-events:none;
}

/* 2 Photos: Dual Composition */
.dual-photo-wrap {
  display:flex; align-items:center; justify-content:center;
  gap: 38px;
}
.dual-card {
  position:relative;
}
.photo-frame-dual {
  width: 295px; height: 390px;
  border-radius: 147px 147px 22px 22px;
  border: 5px solid ${accent};
  box-shadow: 0 12px 35px rgba(0,0,0,0.65), 0 0 25px ${accent}33;
  overflow:hidden;
  background: ${secondary};
}
.primary-card .photo-frame-dual {
  width: 320px; height: 420px;
  border-radius: 160px 160px 24px 24px;
  border: 6px solid ${accent};
}

/* 3 Photos: Pyramid Hierarchy */
.triple-photo-wrap {
  display:flex; flex-direction:column;
  align-items:center; gap: 14px;
}
.triple-top {
  position:relative; z-index:3;
}
.leader-frame {
  width: 290px; height: 350px;
  border-radius: 145px 145px 20px 20px;
  border: 5px solid ${accent};
  box-shadow: 0 14px 40px rgba(0,0,0,0.7), 0 0 35px ${accent}44;
  overflow:hidden;
  background: ${secondary};
}
.triple-bottom {
  display:flex; justify-content:center;
  gap: 34px; margin-top: -30px;
  position:relative; z-index:2;
}
.flank-frame {
  width: 230px; height: 280px;
  border-radius: 115px 115px 16px 16px;
  border: 4px solid #ffffffaa;
  box-shadow: 0 10px 28px rgba(0,0,0,0.6);
  overflow:hidden;
  background: ${secondary};
}

/* Zero photo shield fallback */
.emblem-shield {
  width:220px; height:220px;
  border-radius:50%;
  border: 4px solid ${accent};
  background: radial-gradient(circle, ${secondary}, ${primary});
  display:flex; align-items:center; justify-content:center;
  box-shadow: 0 0 35px ${accent}44;
}
.emblem-inner {
  width:180px; height:180px;
  border-radius:50%;
  border: 2px dashed ${accent}88;
  display:flex; align-items:center; justify-content:center;
}
.emblem-star { width:80px; height:80px; }

/* ── Person & Candidate Content Section ─────────────────────────────── */
.candidate-section {
  display:flex; flex-direction:column;
  align-items:center; text-align:center;
  margin-top: 10px;
}

.candidate-name-box {
  margin-bottom: 6px;
}
.candidate-name {
  font-family:'Noto Serif Bengali', serif;
  font-size: 58px; font-weight: 800;
  color: #ffffff;
  line-height: 1.15;
  text-shadow: 0 4px 18px rgba(0,0,0,0.9);
  letter-spacing: 0.5px;
}

.designation-badge {
  display:inline-flex; align-items:center; justify-content:center;
  background: linear-gradient(90deg, transparent, ${accent}28, transparent);
  border-top: 1px solid ${accent}66;
  border-bottom: 1px solid ${accent}66;
  padding: 6px 36px;
  margin: 6px 0 10px 0;
}
.designation-text {
  font-family:'Hind Siliguri', sans-serif;
  font-size: 32px; font-weight: 700;
  color: ${accent};
  letter-spacing: 0.5px;
  text-shadow: 0 2px 10px rgba(0,0,0,0.5);
}

.party-location-row {
  display:flex; flex-wrap:wrap; justify-content:center; align-items:center;
  gap: 12px; margin-bottom: 14px;
}
.party-chip {
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.18);
  border-radius: 20px;
  padding: 5px 22px;
  font-size: 24px; font-weight: 600;
  color: #e2e8f0;
}
.location-chip {
  background: rgba(0,0,0,0.3);
  border: 1px solid ${accent}44;
  border-radius: 20px;
  padding: 5px 22px;
  font-size: 22px; font-weight: 500;
  color: ${accent};
}

.slogan-banner {
  max-width: 900px;
  margin: 8px auto 16px auto;
  padding: 14px 44px;
  background: linear-gradient(90deg, transparent, rgba(0,0,0,0.45), transparent);
  border-left: 3px solid ${accent};
  border-right: 3px solid ${accent};
  border-radius: 6px;
}
.slogan-text {
  font-family:'Noto Serif Bengali', serif;
  font-size: 28px; font-weight: 600;
  color: #f1f5f9;
  font-style: italic;
  text-shadow: 0 2px 8px rgba(0,0,0,0.6);
  line-height: 1.35;
}

/* ── Traditional Ceremonial Footer ──────────────────────────────────── */
.ceremonial-footer {
  position:relative; left:-75px; right:-75px; width:1200px;
  background: linear-gradient(180deg, ${secondary}ee 0%, #030814 100%);
  border-top: 3px solid ${accent};
  box-shadow: 0 -8px 25px rgba(0,0,0,0.5);
  padding: 22px 65px;
  display:flex; justify-content:space-between; align-items:center;
  margin-top:auto;
}

.footer-left {
  display:flex; align-items:center; gap: 16px;
}
.prochare-pill {
  background: ${accent};
  color: #030814;
  font-family:'Hind Siliguri', sans-serif;
  font-size: 20px; font-weight: 800;
  padding: 6px 18px;
  border-radius: 6px;
  letter-spacing: 0.5px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.3);
}
.prochare-name {
  font-size: 26px; font-weight: 700;
  color: #ffffff;
}

.footer-right {
  text-align:right;
}
.footer-party {
  font-size: 22px; font-weight: 600;
  color: ${accent};
}
.footer-district {
  font-size: 18px; color: #94a3b8;
}

.watermark-tag {
  position:absolute; bottom: 84px; right: 40px;
  font-size: 14px; font-weight: 700;
  color: rgba(255,255,255,0.12);
  letter-spacing: 4px;
}

/* ── Template Specific Styles ────────────────────────────────────────── */
/* 1. Formal / Clean */
.template-formal .photo-frame-hero {
  border-width: 5px;
}
.template-formal .candidate-name {
  font-size: 58px;
}

/* 2. Photo-focused */
.template-photoFocus .photo-frame-hero {
  width: 440px; height: 530px;
  border-width: 7px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.8), 0 0 55px ${accent}66;
}
.template-photoFocus .hero-halo {
  width: 540px; height: 620px;
  filter: blur(28px);
  background: radial-gradient(circle, ${accent}44 0%, transparent 70%);
}
.template-photoFocus .primary-card .photo-frame-dual {
  width: 340px; height: 440px;
}
.template-photoFocus .candidate-name {
  font-size: 64px;
  text-shadow: 0 4px 25px rgba(0,0,0,0.95), 0 0 15px ${accent}44;
}

/* 3. Occasion / Event */
.template-occasion .occasion-pill-badge {
  padding: 10px 42px;
  border-width: 2.5px;
  background: linear-gradient(135deg, ${accent}40, ${secondary});
  box-shadow: 0 6px 25px ${accent}33;
}
.template-occasion .occasion-pill-text {
  font-size: 26px;
  letter-spacing: 2px;
}
.template-occasion .main-headline {
  font-size: 78px;
  text-shadow: 0 6px 25px rgba(0,0,0,0.9), 0 0 35px ${accent}66;
}
.template-occasion .slogan-banner {
  border: 1.5px solid ${accent}77;
  background: radial-gradient(circle, rgba(0,0,0,0.55), rgba(0,0,0,0.3));
  border-radius: 12px;
}
</style>
</head>
<body>
  <!-- Layered Backgrounds -->
  <div class="bg-layer-base"></div>
  <div class="bg-layer-radial-light"></div>
  <div class="bg-layer-rays"></div>
  <div class="bg-vignette"></div>

  <!-- Occasion-specific Motifs -->
  ${occ === "victoryDay" ? `
    <div style="position:absolute; top:130px; left:50%; transform:translateX(-50%); width:520px; height:520px; border-radius:50%; background:radial-gradient(circle, #ff2a3d 0%, #d80018 70%, #990010 100%); opacity:0.85; z-index:2; box-shadow:0 0 80px rgba(220,0,0,0.5); pointer-events:none;"></div>
    <svg style="position:absolute; top:200px; left:50%; transform:translateX(-50%); width:460px; height:460px; z-index:3; opacity:0.35; pointer-events:none;" viewBox="0 0 100 100" fill="#01140d">
      <polygon points="50,10 46,90 54,90" />
      <polygon points="50,25 38,90 44,90" />
      <polygon points="50,25 56,90 62,90" />
      <polygon points="50,45 30,90 36,90" />
      <polygon points="50,45 64,90 70,90" />
    </svg>
  ` : ""}

  ${occ === "eid" ? `
    <svg style="position:absolute; top:80px; left:50%; transform:translateX(-50%); width:170px; height:170px; z-index:3; opacity:0.85; pointer-events:none;" viewBox="0 0 100 100" fill="${accent}">
      <path d="M40,15 A35,35 0 1,0 85,75 A30,30 0 1,1 40,15 Z" />
      <polygon points="76,32 79,40 88,40 81,46 83,54 76,49 69,54 71,46 64,40 73,40" />
    </svg>
    <svg style="position:absolute; bottom:380px; left:0; width:1200px; height:240px; z-index:2; opacity:0.3; pointer-events:none;" viewBox="0 0 600 100" preserveAspectRatio="none" fill="#011a10">
      <rect x="0" y="80" width="600" height="20" />
      <path d="M220,80 C220,40 380,40 380,80 Z" />
      <rect x="80" y="20" width="22" height="60" />
      <polygon points="91,5 75,20 107,20" />
      <rect x="498" y="20" width="22" height="60" />
      <polygon points="509,5 493,20 525,20" />
    </svg>
  ` : ""}

  ${occ === "condolence" ? `
    <div style="position:absolute; top:110px; left:50%; transform:translateX(-50%); z-index:3; display:flex; flex-direction:column; align-items:center; pointer-events:none;">
      <div style="width:50px; height:50px; border-radius:50%; background:rgba(254,240,138,0.4); filter:blur(10px);"></div>
      <div style="width:24px; height:38px; border-radius:50% 50% 35% 35%; background:linear-gradient(to top, #f59e0b, #fef08a, #fff); margin-top:-35px;"></div>
      <div style="width:3px; height:12px; background:#111;"></div>
      <div style="width:24px; height:50px; background:#cbd5e1; border-radius:3px; box-shadow:0 4px 10px rgba(0,0,0,0.5);"></div>
    </div>
  ` : ""}

  ${occ === "campaign" ? `
    <div style="position:absolute; right:110px; top:540px; width:140px; height:140px; border-radius:50%; background:#ffffff; border:5px solid ${accent}; z-index:15; display:flex; flex-direction:column; align-items:center; justify-content:center; box-shadow:0 12px 35px rgba(0,0,0,0.7); color:#051329;">
      <svg style="width:48px; height:48px; fill:${accent};" viewBox="0 0 24 24">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
      </svg>
      <span style="font-family:'Hind Siliguri', sans-serif; font-size:18px; font-weight:900; margin-top:2px;">প্রতীক</span>
    </div>
  ` : ""}

  <!-- Decorative Borders -->
  <div class="outer-border"></div>
  <div class="inner-border"></div>
  <div class="corner-filigree corner-tl"></div>
  <div class="corner-filigree corner-tr"></div>
  <div class="corner-filigree corner-bl"></div>
  <div class="corner-filigree corner-br"></div>

  <!-- Main Canvas Content -->
  <div class="canvas-wrapper template-${templateStyle}">
    <!-- Header -->
    <div class="header-area">
      <div class="occasion-pill-badge">
        <span class="occasion-pill-text">${topBadgeText}</span>
      </div>

      <div class="main-headline-box">
        <h1 class="main-headline">${mainHeadline}</h1>
      </div>

      <div class="header-accent-divider">
        <div class="divider-line"></div>
        <div class="divider-diamond"></div>
        <div class="divider-line"></div>
      </div>
    </div>

    <!-- Dynamic Photo Composition -->
    ${photoMarkup}

    <!-- Candidate Information Hierarchy -->
    <div class="candidate-section">
      <div class="candidate-name-box">
        <h2 class="candidate-name">${candidateName}</h2>
      </div>

      ${designation ? `
      <div class="designation-badge">
        <span class="designation-text">${designation}</span>
      </div>` : ""}

      <div class="party-location-row">
        ${party ? `<span class="party-chip">${party}</span>` : ""}
        ${locationText ? `<span class="location-chip">📍 ${locationText}</span>` : ""}
      </div>

      ${sloganText ? `
      <div class="slogan-banner">
        <p class="slogan-text">"${sloganText}"</p>
      </div>` : ""}
    </div>

    <div class="watermark-tag">POSTERA AI</div>

    <!-- Professional Footer Credit Bar -->
    <div class="ceremonial-footer">
      <div class="footer-left">
        <div class="prochare-pill">${occ === "condolence" ? "শোকান্তে:" : occ === "conference" ? "আহ্বানে:" : "শুভেচ্ছান্তে:"}</div>
        <div class="prochare-name">${candidateName}${designation ? " (" + designation + ")" : ""}</div>
      </div>
      <div class="footer-right">
        <div class="footer-party">${party || ""}</div>
        <div class="footer-district">${locationText || ""}</div>
      </div>
    </div>
  </div>
</body>
</html>`;
};

export const renderPoster = async (
  formData: FormData,
  photoUrls: string[],
  design: GeminiDesignSuggestion
): Promise<string> => {
  // Convert photo URLs to base64
  const photoBase64: string[] = [];
  for (const url of photoUrls.slice(0, 3)) {
    try {
      photoBase64.push(await fetchBase64(url));
    } catch {
      console.log("Skipping photo:", url);
    }
  }

  const html = buildHTML(formData, photoBase64, design);

  const browser = await puppeteer.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--single-process",
      "--font-render-hinting=none",
    ],
  });

  try {
    const page = await browser.newPage();
    // High-resolution deviceScaleFactor: 2 renders at crisp 2400x3200 internal quality
    await page.setViewport({ width: 1200, height: 1600, deviceScaleFactor: 2 });
    await page.setContent(html, { waitUntil: "networkidle0", timeout: 35000 });
    
    // Allow Google Fonts to settle
    await new Promise((r) => setTimeout(r, 1200));

    const screenshot = await page.screenshot({
      type: "png",
      clip: { x: 0, y: 0, width: 1200, height: 1600 },
    });

    const buffer = Buffer.isBuffer(screenshot)
      ? screenshot
      : Buffer.from(screenshot as Uint8Array);

    // Upload to Cloudinary
    const url = await new Promise<string>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          { folder: "postera_generated", resource_type: "image", format: "png" },
          (err, result) => {
            if (err || !result) reject(err || new Error("Upload failed"));
            else resolve(result.secure_url);
          }
        )
        .end(buffer);
    });

    return url;
  } finally {
    await browser.close();
  }
};
