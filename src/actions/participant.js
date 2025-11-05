'use server';

import mongoose from "mongoose";
import { connectDB } from "@/lib/mongoose";
import { Participant } from "@/models/Participant";


export async function getParticipantsCount(giveawayId, userId) {
    await connectDB();

    const giveawayObjectId = new mongoose.Types.ObjectId(giveawayId);

    const count = await Participant.countDocuments({
        giveawayId: giveawayObjectId,
    });

    const participantDoc = await Participant.findOne({
        giveawayId: giveawayObjectId,
        "user.id": userId,
    }).select("_id");

    return {
        count,
        id: participantDoc?._id.toHexString() || null
    };
}


export async function getParticipant(id) {
    await connectDB();

    const participant = await Participant.findOne({ _id: new mongoose.Types.ObjectId(id) })
        .select('-_id -__v')
        .lean();

    return participant;
}


export async function addParticipant(data) {
    await connectDB();

    // Check if user already participated
    const existing = await Participant.findOne({
        giveawayId: data.giveawayId,
        "user.id": data.user.id
    });

    if (existing) {
        return { message: "You have already participated in this giveaway.", error: true, id: existing.id };
    }

    const participant = new Participant({
        giveawayId: data.giveawayId,
        user: {
            id: data.user.id,
            first_name: data.user.first_name,
            last_name: data.user.last_name || "",
            username: data.user.username || "",
            is_premium: data.user.is_premium || false,
            photo_url: data.user.photo_url || ""
        },
        participatedOn: data.participatedOn || Math.floor(Date.now() / 1000)
    });

    await participant.save();

    const result = participant.toObject({ getters: true });
    delete result._id;
    delete result.__v;

    return result;
}
