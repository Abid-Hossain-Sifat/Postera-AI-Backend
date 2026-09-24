import mongoose, { Schema, model} from "mongoose"


// User Schema 
const userSchema = new Schema(
    {
        name: { type: String, required: true},
        email: { type: String, required: true, unique: true},
        password: { type: String, required: true},
        role: { type: String, enum: ["user", "admin"], default:"user"}
    },
    {
        timestamps: true
    }
)

// Export user Model 
export const User = model("User", userSchema);



// Poster Template Schema 
const posterTemplateSchema = new Schema(
    {
        title: {type: String, required: true},
        categoryType: { type: String, enum: ["victoryDay", "campaign","condolence","greetings","eid"], required: true},
        posterUrl: { type: String, required: true},
        layoutConfig: { type: Schema.Types.Mixed, default: {}},
        isActive: { type: Boolean, default: true},
    },
    {
        timestamps: true
    }
);


// Export Poster Model 
export const PosterTemplate = model("PosterTemplate", posterTemplateSchema);



// User's Generated Poster Schema
const posterSchema = new Schema(
  {
    userId: { 
      type: Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },
    templateId: { 
      type: Schema.Types.ObjectId, 
      ref: "PosterTemplate", 
      required: true 
    },
    formData: {
      name: { type: String, required: true },
      designation: { type: String },
      party: { type: String },       
      district: { type: String },
      headline: { type: String }
    },
    uploadedPhotoUrls: [{ type: String }],
    generatedImageUrl: { type: String, default: "" },
    status: {
      type: String,
      enum: ["draft", "generating", "completed", "failed"],
      default: "draft"
    }
  },
  {
    timestamps: true
  }
);

// Export Poster Model
export const Poster = model("Poster", posterSchema);



