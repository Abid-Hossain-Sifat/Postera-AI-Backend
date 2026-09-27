import express, { Request, Response } from "express";
import multer from "multer";
import mongoose from "mongoose";
import puppeteer from "puppeteer";
import rateLimit from "express-rate-limit";
import { v2 as cloudinary } from "cloudinary";
import { Poster, PosterTemplate } from "./models";
import { verifyToken } from "./auth";
import { getLayoutSuggestion } from "./gemini";
import { renderPoster } from "./render";
import dotenv from "dotenv";
dotenv.config();

export const posterLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: { message: "অনেক বেশি request। ১৫ মিনিট পরে আবার চেষ্টা করুন।" },
});

export const posterRouter = express.Router();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

const uploadToCloudinary = (buffer: Buffer): Promise<string> =>
  new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream({ folder: "postera_uploads" }, (err, result) => {
        if (err || !result) reject(err);
        else resolve(result.secure_url);
      })
      .end(buffer);
  });

const generateAsync = async (
  posterId: string,
  formData: any,
  photoUrls: string[]
) => {
  try {
    const layout = await getLayoutSuggestion(
      formData.occasion || "greetings",
      formData,
      photoUrls.length
    );
    const generatedImageUrl = await renderPoster(formData, photoUrls, layout);
    await Poster.findByIdAndUpdate(posterId, {
      generatedImageUrl,
      status: "completed",
    });
  } catch (err) {
    console.error("Generation failed:", err);
    await Poster.findByIdAndUpdate(posterId, { status: "failed" });
  }
};

// POST /api/posters
posterRouter.post(
  "/",
  verifyToken,
  posterLimiter,
  upload.array("photos", 3),
  async (req: Request, res: Response) => {
    try {
      const {
        name, designation, party, district,
        unionThana, occasion, slogan, templateId, templateStyle,
      } = req.body;
      const userId = (req as any).user.userId;

      if (!name) {
        return res.status(400).json({ message: "name is required" });
      }

      // Safely resolve templateId to prevent Mongoose CastError
      let resolvedTemplateId = templateId;
      if (!mongoose.Types.ObjectId.isValid(templateId)) {
        const found = await PosterTemplate.findOne({
          $or: [{ categoryType: occasion }, { isActive: true }],
        });
        resolvedTemplateId = found ? found._id : new mongoose.Types.ObjectId();
      }

      const files = req.files as Express.Multer.File[];
      const photoUrls: string[] = [];
      if (files?.length) {
        for (const f of files) {
          photoUrls.push(await uploadToCloudinary(f.buffer));
        }
      }

      const poster = await Poster.create({
        userId,
        templateId: resolvedTemplateId,
        formData: { name, designation, party, district, unionThana, headline: slogan, slogan, occasion, templateStyle },
        uploadedPhotoUrls: photoUrls,
        status: "generating",
      });

      // Fire-and-forget
      generateAsync(
        poster._id.toString(),
        { name, designation, party, district, unionThana, slogan, occasion, templateStyle },
        photoUrls
      );

      res.status(201).json({ _id: poster._id, status: "generating" });
    } catch (err: any) {
      res.status(500).json({ message: "Server error", error: err.message });
    }
  }
);

// GET /api/posters/user/:userId and /api/posters/user/me
posterRouter.get("/user/:userId", verifyToken, async (req: Request, res: Response) => {
  try {
    const requestedId = req.params.userId;
    const tokenUserId = (req as any).user.userId;
    const userId = requestedId === "me" ? tokenUserId : requestedId;
    const posters = await Poster.find({ userId }).sort({ createdAt: -1 });
    res.json(posters);
  } catch (err: any) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// GET /api/posters/:id/pdf (Export Print-Ready PDF)
posterRouter.get("/:id/pdf", async (req: Request, res: Response) => {
  try {
    const poster = await Poster.findById(req.params.id);
    if (!poster) return res.status(404).json({ message: "Poster not found" });
    if (!poster.generatedImageUrl) {
      return res.status(400).json({ message: "Poster image is not ready yet" });
    }

    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
    });

    try {
      const page = await browser.newPage();
      await page.setViewport({ width: 1200, height: 1600 });
      const html = `<!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          @page { size: A4 portrait; margin: 0; }
          * { margin:0; padding:0; box-sizing:border-box; }
          body { margin:0; padding:0; background:#000; width:100vw; height:100vh; display:flex; align-items:center; justify-content:center; }
          img { width:100%; height:100%; object-fit:contain; }
        </style>
      </head>
      <body>
        <img src="${poster.generatedImageUrl}" alt="Poster" />
      </body>
      </html>`;
      await page.setContent(html, { waitUntil: "load", timeout: 30000 });
      const pdfBuffer = await page.pdf({
        format: "A4",
        printBackground: true,
        preferCSSPageSize: true,
      });

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="poster-${poster._id}.pdf"`);
      return res.send(Buffer.from(pdfBuffer));
    } finally {
      await browser.close();
    }
  } catch (err: any) {
    console.error("PDF generation failed:", err);
    res.status(500).json({ message: "PDF generation failed", error: err.message });
  }
});

// GET /api/posters/:id
posterRouter.get("/:id", async (req: Request, res: Response) => {
  try {
    const poster = await Poster.findById(req.params.id);
    if (!poster) return res.status(404).json({ message: "Poster not found" });
    res.json(poster);
  } catch (err: any) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// POST /api/posters/:id/regenerate
posterRouter.post(
  "/:id/regenerate",
  verifyToken,
  posterLimiter,
  async (req: Request, res: Response) => {
    try {
      const poster = await Poster.findById(req.params.id);
      if (!poster) return res.status(404).json({ message: "Poster not found" });

      const userId = (req as any).user.userId;
      if (poster.userId.toString() !== userId) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      if ((poster as any).retryCount >= 3) {
        return res.status(400).json({ message: "Maximum 3 retries reached" });
      }

      await Poster.findByIdAndUpdate(req.params.id, {
        status: "generating",
        $inc: { retryCount: 1 },
      });

      generateAsync(
        req.params.id as string,
        poster.formData,
        poster.uploadedPhotoUrls
      );

      res.json({ _id: poster._id, status: "generating" });
    } catch (err: any) {
      res.status(500).json({ message: "Server error", error: err.message });
    }
  }
);

// DELETE /api/posters/:id
posterRouter.delete("/:id", verifyToken, async (req: Request, res: Response) => {
  try {
    const poster = await Poster.findById(req.params.id);
    if (!poster) return res.status(404).json({ message: "Poster not found" });

    const userId = (req as any).user.userId;
    if (poster.userId.toString() !== userId) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    await Poster.findByIdAndDelete(req.params.id);
    res.json({ message: "Poster deleted" });
  } catch (err: any) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});
