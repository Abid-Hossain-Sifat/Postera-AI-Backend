import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);

export interface GeminiDesignSuggestion {
  layout: "hero" | "dual" | "triple";
  templateStyle: "formal" | "photoFocus" | "occasion";
  backgroundStyle: "gradient" | "textured" | "abstract";
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  headlineAlignment: "left" | "center" | "right";
  photoArrangement: "hero" | "dual" | "pyramid";
  decorationStyle: "geometric" | "ornate" | "modern";
  photoEmphasis: "primary" | "balanced";
}

const DEFAULTS: Record<string, GeminiDesignSuggestion> = {
  victoryDay: {
    layout: "hero",
    templateStyle: "occasion",
    backgroundStyle: "gradient",
    primaryColor: "#052014",
    secondaryColor: "#004733",
    accentColor: "#F59E0B",
    headlineAlignment: "center",
    photoArrangement: "hero",
    decorationStyle: "ornate",
    photoEmphasis: "primary",
  },
  campaign: {
    layout: "hero",
    templateStyle: "photoFocus",
    backgroundStyle: "textured",
    primaryColor: "#06132b",
    secondaryColor: "#0f2858",
    accentColor: "#EAB308",
    headlineAlignment: "center",
    photoArrangement: "hero",
    decorationStyle: "geometric",
    photoEmphasis: "primary",
  },
  condolence: {
    layout: "hero",
    templateStyle: "formal",
    backgroundStyle: "abstract",
    primaryColor: "#0f172a",
    secondaryColor: "#1e293b",
    accentColor: "#CBD5E1",
    headlineAlignment: "center",
    photoArrangement: "hero",
    decorationStyle: "formal" as any,
    photoEmphasis: "balanced",
  },
  eid: {
    layout: "hero",
    templateStyle: "occasion",
    backgroundStyle: "textured",
    primaryColor: "#06281e",
    secondaryColor: "#0d4434",
    accentColor: "#FBBF24",
    headlineAlignment: "center",
    photoArrangement: "hero",
    decorationStyle: "ornate",
    photoEmphasis: "primary",
  },
  greetings: {
    layout: "hero",
    templateStyle: "formal",
    backgroundStyle: "gradient",
    primaryColor: "#081b3a",
    secondaryColor: "#12326b",
    accentColor: "#F59E0B",
    headlineAlignment: "center",
    photoArrangement: "hero",
    decorationStyle: "modern",
    photoEmphasis: "balanced",
  },
  greeting: {
    layout: "hero",
    templateStyle: "formal",
    backgroundStyle: "gradient",
    primaryColor: "#081b3a",
    secondaryColor: "#12326b",
    accentColor: "#F59E0B",
    headlineAlignment: "center",
    photoArrangement: "hero",
    decorationStyle: "modern",
    photoEmphasis: "balanced",
  },
  conference: {
    layout: "hero",
    templateStyle: "photoFocus",
    backgroundStyle: "textured",
    primaryColor: "#1e1b4b",
    secondaryColor: "#312e81",
    accentColor: "#F59E0B",
    headlineAlignment: "center",
    photoArrangement: "pyramid",
    decorationStyle: "ornate",
    photoEmphasis: "balanced",
  },
};

export const getLayoutSuggestion = async (
  occasion: string,
  formData: {
    name: string;
    designation?: string;
    party?: string;
    district?: string;
    templateStyle?: string;
  },
  photoCount: number = 1
): Promise<GeminiDesignSuggestion> => {
  const safePhotoCount = Math.max(1, Math.min(3, photoCount));
  const defaultLayout = safePhotoCount === 1 ? "hero" : safePhotoCount === 2 ? "dual" : "triple";
  const defaultPhotoArr = safePhotoCount === 1 ? "hero" : safePhotoCount === 2 ? "dual" : "pyramid";

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `You are a professional design director specializing in prestigious Bangladeshi political, civic, and occasion posters.
Provide design layout recommendations for a "${occasion}" poster with ${safePhotoCount} person photo(s).

User details:
- Name: ${formData.name}
- Designation: ${formData.designation || "N/A"}
- Party/Organization: ${formData.party || "N/A"}
- District/Location: ${formData.district || "N/A"}
- Preferred Style: ${formData.templateStyle || "auto"}

Return ONLY a strict JSON object with NO markdown, NO code block ticks, NO explanations:
{
  "layout": "${defaultLayout}",
  "templateStyle": "${formData.templateStyle && formData.templateStyle !== 'auto' ? formData.templateStyle : (occasion === 'victoryDay' || occasion === 'eid' ? 'occasion' : 'formal')}",
  "backgroundStyle": "gradient",
  "primaryColor": "#06132b",
  "secondaryColor": "#0f2858",
  "accentColor": "#EAB308",
  "headlineAlignment": "center",
  "photoArrangement": "${defaultPhotoArr}",
  "decorationStyle": "ornate",
  "photoEmphasis": "primary"
}

Aesthetic rules:
- primaryColor: Deep navy/midnight blue (#06132b, #051b3a, #030d20) or deep bottle green (#052014) for victory/eid. Avoid light/flat blues.
- secondaryColor: Rich dark tone harmonious with primary.
- accentColor: Prestigious royal gold (#EAB308, #F59E0B, #FFD700) or silver (#CBD5E1) for condolence.
- templateStyle must be one of: "formal", "photoFocus", "occasion".
- layout must be "${defaultLayout}".
- photoArrangement must be "${defaultPhotoArr}".`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const cleaned = text.replace(/```json\n?|\n?```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    const fallback = DEFAULTS[occasion] || DEFAULTS.campaign;

    return {
      layout: defaultLayout,
      templateStyle:
        parsed.templateStyle === "formal" || parsed.templateStyle === "photoFocus" || parsed.templateStyle === "occasion"
          ? parsed.templateStyle
          : (formData.templateStyle && formData.templateStyle !== "auto" ? (formData.templateStyle as any) : fallback.templateStyle),
      backgroundStyle: parsed.backgroundStyle === "textured" || parsed.backgroundStyle === "abstract" ? parsed.backgroundStyle : "gradient",
      primaryColor: /^#[0-9A-Fa-f]{6}$/.test(parsed.primaryColor) ? parsed.primaryColor : fallback.primaryColor,
      secondaryColor: /^#[0-9A-Fa-f]{6}$/.test(parsed.secondaryColor) ? parsed.secondaryColor : fallback.secondaryColor,
      accentColor: /^#[0-9A-Fa-f]{6}$/.test(parsed.accentColor) ? parsed.accentColor : fallback.accentColor,
      headlineAlignment: parsed.headlineAlignment === "left" || parsed.headlineAlignment === "right" ? parsed.headlineAlignment : "center",
      photoArrangement: defaultPhotoArr,
      decorationStyle: parsed.decorationStyle === "geometric" || parsed.decorationStyle === "modern" ? parsed.decorationStyle : "ornate",
      photoEmphasis: parsed.photoEmphasis === "balanced" ? "balanced" : "primary",
    };
  } catch (err) {
    console.log("Gemini fallback used:", err);
    const fallback = DEFAULTS[occasion] || DEFAULTS.campaign;
    return {
      ...fallback,
      layout: defaultLayout,
      photoArrangement: defaultPhotoArr,
      templateStyle: formData.templateStyle && formData.templateStyle !== "auto" ? (formData.templateStyle as any) : fallback.templateStyle,
    };
  }
};
