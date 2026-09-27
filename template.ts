import express, { Request, Response } from "express";
import { PosterTemplate } from "./models";

export const templateRouter = express.Router();

// GET /api/templates
templateRouter.get("/", async (req: Request, res: Response) => {
  try {
    const query: any = { isActive: true };
    if (req.query.occasion) query.categoryType = req.query.occasion;
    const templates = await PosterTemplate.find(query).sort({ createdAt: -1 });
    res.json(templates);
  } catch (err: any) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// GET /api/templates/:id
templateRouter.get("/:id", async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id || "");
    let template = null;

    if (id && id.match(/^[0-9a-fA-F]{24}$/)) {
      template = await PosterTemplate.findById(id);
    }

    if (!template) {
      // Find by categoryType if id matches an occasion name
      template = await PosterTemplate.findOne({
        $or: [{ categoryType: id }, { title: new RegExp(id, "i") }],
        isActive: true,
      });
    }

    if (!template) {
      // If numeric id like 1, 2, 3... find by index
      const num = parseInt(id, 10);
      if (!isNaN(num) && num > 0) {
        const all = await PosterTemplate.find({ isActive: true }).sort({ createdAt: 1 });
        if (all[num - 1]) template = all[num - 1];
      }
    }

    if (!template) {
      template = await PosterTemplate.findOne({ isActive: true });
    }

    if (!template) return res.status(404).json({ message: "Template not found" });
    res.json(template);
  } catch (err: any) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});
