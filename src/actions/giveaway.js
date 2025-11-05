'use server';

import mongoose from 'mongoose';
import { connectDB } from '@/lib/mongoose';
import { Giveaway } from '@/models/Giveaway';


export async function getGiveaway(id) {
    await connectDB();

    const giveaway = await Giveaway.findOne({ _id: new mongoose.Types.ObjectId(id) })
        .select('-_id -__v')
        .lean();

    return giveaway;
}


export async function addGiveaway(data) {
    await connectDB();

    const giveaway = new Giveaway({
        chats: data.chats,
        numWinners: data.numWinners || 3,
        minVotes: data.minVotes || 1,
        pRequirements: {
            chatMember: data.pRequirements?.chatMember || true,
            premiumUser: data.pRequirements?.premiumUser || false,
            chatBooster: data.pRequirements?.chatBooster || false
        },
        vRequirements: {
            chatMember: data.vRequirements?.chatMember || true,
            premiumUser: data.vRequirements?.premiumUser || false,
            chatBooster: data.vRequirements?.chatBooster || false
        },
        rewards: data.rewards || {},
        startTime: data.startTime,
        endTime: data.endTime,
        createdBy: {
            id: data.user.id,
            first_name: data.user.first_name,
            last_name: data.user.last_name || "",
            username: data.user.username || "",
            is_premium: data.user.is_premium || false,
            photo_url: data.user.photo_url || ""
        },
        createdOn: Math.floor(Date.now() / 1000)
    });

    await giveaway.save();

    const result = giveaway.toObject({ getters: true });
    delete result._id;
    delete result.__v;

    return result;
}