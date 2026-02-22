import { Schema, model, Types } from "mongoose";
import { createPresignedUpload } from "../../infrastructure/storage/s3.js";

const mediaSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, required: true, index: true },
    key: { type: String, required: true, unique: true },
    url: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    encrypted: { type: Boolean, default: true },
    status: { type: String, enum: ["pending", "completed"], default: "pending", index: true }
  },
  { timestamps: true, versionKey: false }
);

const MediaModel = model("media_objects", mediaSchema);

export class MediaService {
  async requestUpload(input: { userId: string; fileName: string; contentType: string }) {
    const presigned = await createPresignedUpload(input);

    await MediaModel.create({
      userId: new Types.ObjectId(input.userId),
      key: presigned.key,
      url: presigned.publicUrl,
      mimeType: input.contentType,
      size: 0,
      encrypted: true,
      status: "pending"
    });

    return presigned;
  }

  async completeUpload(input: { userId: string; key: string; size: number; mimeType: string }) {
    await MediaModel.updateOne(
      {
        userId: new Types.ObjectId(input.userId),
        key: input.key
      },
      {
        $set: {
          size: input.size,
          mimeType: input.mimeType,
          status: "completed"
        }
      }
    );
  }
}
