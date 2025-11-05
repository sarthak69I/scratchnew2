import mongoose from "mongoose";

import { UserSchema } from "./User";

const ParticipantSchema = new mongoose.Schema({
    giveawayId: { type: String, required: true },
    user: { type: UserSchema, required: true },
    participatedOn: { type: Number, required: true, default: () => Math.floor(Date.now() / 1000) }
});

export const Participant = mongoose.models.Participant || mongoose.model("Participant", ParticipantSchema);