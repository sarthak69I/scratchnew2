import mongoose from 'mongoose';

import { UserSchema } from './User';

const ChatSchema = new mongoose.Schema({
    id: { type: Number, required: true },
    title: { type: String, required: true },
    link: { type: String, required: true },
    photo: { type: String, default: "" }
}, { _id: false }); // Disable _id for subdocuments

const GiveawaySchema = new mongoose.Schema({
    chats: [ChatSchema],
    numWinners: { type: Number, default: 3, min: 1 },
    minVotes: { type: Number, default: 1, min: 1 },
    pRequirements: {
        chatMember: { type: Boolean, default: true },
        premiumUser: { type: Boolean, default: false },
        chatBooster: { type: Boolean, default: false }
    },
    vRequirements: {
        chatMember: { type: Boolean, default: true },
        premiumUser: { type: Boolean, default: false },
        chatBooster: { type: Boolean, default: false }
    },
    rewards: {
        type: Map,
        of: [String],
        default: {}
    },
    startTime: { type: Number, required: true },
    endTime: { type: Number, required: true },
    createdBy: { type: UserSchema, required: true },
    createdOn: { type: Number, default: () => Math.floor(Date.now() / 1000) }
});

export const Giveaway = mongoose.models.Giveaway || mongoose.model('Giveaway', GiveawaySchema);