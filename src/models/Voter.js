import mongoose from "mongoose";

import { UserSchema } from "./User";

const VoterSchema = new mongoose.Schema({
    giveawayId: { type: String, required: true },
    participantId: { type: String, required: true },
    user: { type: UserSchema, required: true },
    votedOn: { type: Number, required: true, default: () => Math.floor(Date.now() / 1000) },
    isInvalid: { type: Boolean }
});

export const Voter = mongoose.models.Voter || mongoose.model("Voter", VoterSchema);