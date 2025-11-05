'use server';

import mongoose from "mongoose";
import { connectDB } from "@/lib/mongoose";
import { Voter } from "@/models/Voter";
import { Participant } from "@/models/Participant";


export async function getVotersCount(giveawayId, participantId, userId) {
    await connectDB();

    // Aggregate vote counts for all participants
    const votes = await Voter.aggregate([
        {
            $match: {
                giveawayId,
                $or: [
                    { isInvalid: false },
                    { isInvalid: { $exists: false } }
                ]
            }
        },
        { $group: { _id: '$participantId', voteCount: { $sum: 1 } } }
    ]);

    if (votes.length === 0) {
        const isVoted = await Voter.exists({
            giveawayId: new mongoose.Types.ObjectId(giveawayId),
            "user.id": userId,
            $or: [{ isInvalid: false }, { isInvalid: { $exists: false } }]
        });

        return { rank: null, voteCount: 0, isVoted: Boolean(isVoted) };
    }

    // Get participant IDs
    const participantIds = votes.map(v => v._id);

    // Fetch participant details to get `participatedOn`
    const participants = await Participant.find(
        { _id: { $in: participantIds } },
        { participatedOn: 1, _id: 1 }
    ).lean();

    // Map votes with participatedOn
    const enrichedVotes = votes
        .map(v => {
            const participant = participants.find(p => p._id.toString() === v._id.toString());
            if (!participant) return null;
            return {
                id: v._id.toString(),
                voteCount: v.voteCount,
                participatedOn: participant.participatedOn
            };
        })
        .filter(Boolean);

    // Sort: voteCount DESC, then participatedOn ASC (earlier first)
    enrichedVotes.sort((a, b) => {
        return b.voteCount - a.voteCount || a.participatedOn - b.participatedOn;
    });

    // Find rank of the target participant
    const participantIndex = enrichedVotes.findIndex(v => v.id === participantId.toString());
    const participantRank = participantIndex !== -1 ? participantIndex + 1 : null;

    // Get vote count
    const participantVote = enrichedVotes.find(v => v.id === participantId.toString());
    const voteCount = participantVote ? participantVote.voteCount : 0;

    // Check if user has voted
    const isVoted = await Voter.exists({
        giveawayId: new mongoose.Types.ObjectId(giveawayId),
        "user.id": userId,
        $or: [{ isInvalid: false }, { isInvalid: { $exists: false } }]
    });

    return {
        rank: participantRank,
        voteCount,
        isVoted: Boolean(isVoted)
    };
}


/**
 * Add a voter entry for a participant in a giveaway.
 * Ensures one unique vote per user per participant per giveaway.
 */
export async function addVoter(data) {
    await connectDB();

    // Check if the user already voted for this participant
    const existing = await Voter.findOne({
        giveawayId: data.giveawayId,
        participantId: data.participantId,
        "user.id": data.user.id
    });

    if (existing) {
        if (!("isInvalid" in existing) || existing.isInvalid === false) {
            return { message: "You have already voted for this participant.", error: true };
        } else {
            existing.isInvalid = false;
            await existing.save();

            const result = existing.toObject({ getters: true });
            delete result._id;
            delete result.__v;

            return { ...result, message: "Vote added successfully.", error: false };
        }
    }

    const voter = new Voter({
        giveawayId: data.giveawayId,
        participantId: data.participantId,
        user: {
            id: data.user.id,
            first_name: data.user.first_name,
            last_name: data.user.last_name || "",
            username: data.user.username || "",
            is_premium: data.user.is_premium || false,
            photo_url: data.user.photo_url || ""
        },
        votedOn: data.votedOn || Math.floor(Date.now() / 1000)
    });

    await voter.save();

    const result = voter.toObject({ getters: true });
    delete result._id;
    delete result.__v;

    return { ...result, message: "Vote added successfully.", error: false };
}


export async function getVotersList(giveawayId, participantId, viewerId) {
    // Validate inputs
    if (!giveawayId || !participantId || !viewerId) {
        throw new Error('Missing giveawayId, participantId, or viewerId');
    }

    try {
        await connectDB();

        // Fetch voters for the given giveawayId and participantId
        const voters = await Voter.find({
            giveawayId, participantId, $or: [
                { isInvalid: false },
                { isInvalid: { $exists: false } }
            ]
        }).lean();

        // Map voters to the desired output format
        const votersList = voters.map(voter => ({
            id: voter._id.toString(),
            name: voter.user.first_name + (voter.user.last_name ? ` ${voter.user.last_name}` : ''),
            photo_url: voter.user.photo_url || null,
            username: voter.user.username || null,
            is_premium: voter.user.is_premium || false,
            votedOn: voter.votedOn,
            isViewer: voter.user.id.toString() === viewerId.toString(),
        }));

        // Sort voters by votedOn timestamp (most recent first)
        votersList.sort((a, b) => b.votedOn - a.votedOn);

        return votersList;
    } catch (error) {
        console.error('Error fetching voters list:', error);
        throw new Error('Failed to fetch voters list');
    }
}