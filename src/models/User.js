import mongoose from "mongoose";

export const UserSchema = new mongoose.Schema({
    id: { type: Number, required: true },
    first_name: { type: String, required: true },
    last_name: { type: String },
    username: { type: String },
    is_premium: { type: Boolean, default: false },
    photo_url: { type: String }
}, { _id: false });
