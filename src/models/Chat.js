import mongoose from 'mongoose';

const ChatSchema = new mongoose.Schema({
    id: { type: Number, required: true },
    title: { type: String, required: true },
    link: { type: String, required: true },
    photo: { type: String, default: "" },
    type: { type: String, required: true }
});

export const Chat = mongoose.models.Chat || mongoose.model('Chat', ChatSchema);