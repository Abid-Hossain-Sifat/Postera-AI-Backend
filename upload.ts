import express, { Request, Response } from "express";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
dotenv.config();


export const uploadRouter = express.Router();

// Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Multer Storage setup
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
});

// Image Upload
uploadRouter.post("/", upload.single("image"), async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No image file provided" });
        }

        // Upload to Cloudinary
        const stream = cloudinary.uploader.upload_stream(
            { folder: "postera_uploads" },
            (error, result) => {
                if (error || !result) {
                    return res.status(500).json({ message: "Cloudinary upload failed", error });
                }

                res.status(200).json({
                    message: "Image uploaded successfully",
                    url: result.secure_url,
                });
            }
        );

        stream.end(req.file.buffer);
    } catch (error: any) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});
