import mongoose from "mongoose";
import { env } from "../../config/env.js";

export const connectMongo = async (): Promise<void> => {
  await mongoose.connect(env.MONGO_URI, {
    serverSelectionTimeoutMS: 5000,
    maxPoolSize: 80,
    minPoolSize: 10
  });
};
