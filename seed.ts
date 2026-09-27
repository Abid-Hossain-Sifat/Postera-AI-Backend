import dns from "node:dns";
try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch (e) {
  console.warn("DNS server warning:", e);
}

import mongoose from "mongoose";
import dotenv from "dotenv";
import { PosterTemplate } from "./models";
dotenv.config();

const templates = [
  {
    title: "মহান বিজয় দিবস ২০২৪",
    categoryType: "victoryDay",
    posterUrl: "/templates/victory-day.svg",
    layoutConfig: {
      colors: { primary: "#006A4E", secondary: "#F42A41", accent: "#FFD700" },
      photoSlots: 3,
    },
    isActive: true,
  },
  {
    title: "নির্বাচনী প্রচারণা পোস্টার",
    categoryType: "campaign",
    posterUrl: "/templates/campaign.svg",
    layoutConfig: {
      colors: { primary: "#1a56db", secondary: "#0a2d6e", accent: "#FFD700" },
      photoSlots: 2,
    },
    isActive: true,
  },
  {
    title: "পবিত্র ঈদ মোবারক শুভেচ্ছা",
    categoryType: "eid",
    posterUrl: "/templates/eid.svg",
    layoutConfig: {
      colors: { primary: "#1B4332", secondary: "#2d6a4f", accent: "#D4AF37" },
      photoSlots: 1,
    },
    isActive: true,
  },
  {
    title: "বিনম্র শ্রদ্ধাঞ্জলি ও শোক পোস্টার",
    categoryType: "condolence",
    posterUrl: "/templates/condolence.svg",
    layoutConfig: {
      colors: { primary: "#1a1a2e", secondary: "#4a4a6a", accent: "#C0C0C0" },
      photoSlots: 2,
    },
    isActive: true,
  },
  {
    title: "শুভেচ্ছা ও অভিনন্দন পোস্টার",
    categoryType: "greetings",
    posterUrl: "/templates/greetings.svg",
    layoutConfig: {
      colors: { primary: "#7B2D8B", secondary: "#4a1260", accent: "#FFD700" },
      photoSlots: 3,
    },
    isActive: true,
  },
  {
    title: "তৃণমূল কর্মী সম্মেলন ও সমাবেশ",
    categoryType: "conference",
    posterUrl: "/templates/conference.svg",
    layoutConfig: {
      colors: { primary: "#1e1b4b", secondary: "#312e81", accent: "#FFD700" },
      photoSlots: 3,
    },
    isActive: true,
  },
];

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI as string);
    console.log("✅ DB Connected");

    // Replace old placeholder templates with real poster templates
    await PosterTemplate.deleteMany({});
    await PosterTemplate.insertMany(templates);
    console.log("✅ 6 authentic poster templates seeded successfully!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  }
};

seed();
