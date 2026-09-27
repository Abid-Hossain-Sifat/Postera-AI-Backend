import express, { Request, Response, NextFunction } from "express";
import { User, PosterTemplate, Poster } from "./models";
import { verifyToken } from "./auth";

export const adminRouter = express.Router();

// Admin role check middleware
const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;
  if (!user || user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
};

adminRouter.use(verifyToken, isAdmin);

// GET /api/admin/stats
adminRouter.get("/stats", async (_req: Request, res: Response) => {
  try {
    const [totalUsers, totalPosters, completedPosters, failedPosters] =
      await Promise.all([
        User.countDocuments(),
        Poster.countDocuments(),
        Poster.countDocuments({ status: "completed" }),
        Poster.countDocuments({ status: "failed" }),
      ]);
    res.json({ totalUsers, totalPosters, completedPosters, failedPosters });
  } catch (err: any) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// GET /api/admin/templates
adminRouter.get("/templates", async (_req: Request, res: Response) => {
  try {
    const templates = await PosterTemplate.find().sort({ createdAt: -1 });
    res.json(templates);
  } catch (err: any) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// POST /api/admin/templates
adminRouter.post("/templates", async (req: Request, res: Response) => {
  try {
    const { title, categoryType, thumbnailUrl, layoutConfig, isActive } = req.body;
    const template = await PosterTemplate.create({
      title,
      categoryType,
      posterUrl: thumbnailUrl,
      layoutConfig: layoutConfig || {},
      isActive: isActive !== undefined ? isActive : true,
    });
    res.status(201).json(template);
  } catch (err: any) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// PATCH /api/admin/templates/:id
adminRouter.patch("/templates/:id", async (req: Request, res: Response) => {
  try {
    const template = await PosterTemplate.findByIdAndUpdate(
      req.params.id,
      { ...req.body },
      { new: true }
    );
    if (!template) return res.status(404).json({ message: "Template not found" });
    res.json(template);
  } catch (err: any) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// DELETE /api/admin/templates/:id
adminRouter.delete("/templates/:id", async (req: Request, res: Response) => {
  try {
    const template = await PosterTemplate.findByIdAndDelete(req.params.id);
    if (!template) return res.status(404).json({ message: "Template not found" });
    res.json({ message: "Template deleted" });
  } catch (err: any) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// GET /api/admin/posters
adminRouter.get("/posters", async (_req: Request, res: Response) => {
  try {
    const posters = await Poster.find()
      .populate("userId", "name email")
      .populate("templateId", "title")
      .sort({ createdAt: -1 });
    res.json(posters);
  } catch (err: any) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// PATCH /api/admin/posters/:id/flag
adminRouter.patch("/posters/:id/flag", async (req: Request, res: Response) => {
  try {
    const { flagged } = req.body;
    const poster = await Poster.findByIdAndUpdate(
      req.params.id,
      { flagged },
      { new: true }
    );
    if (!poster) return res.status(404).json({ message: "Poster not found" });
    res.json(poster);
  } catch (err: any) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});
