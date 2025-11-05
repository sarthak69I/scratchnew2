'use server';

import { connectDB } from '@/lib/mongoose';
import { Participant } from '@/models/Participant';
import { Voter } from '@/models/Voter';

export async function getLeaderboard(giveawayId, viewerId, minVotes = 0) {
  await connectDB();

  // Get vote counts for participants with votes
  const votes = await Voter.aggregate([
    {
      $match: {
        giveawayId, $or: [
          { isInvalid: false },
          { isInvalid: { $exists: false } }
        ]
      }
    },
    { $group: { _id: '$participantId', voteCount: { $sum: 1 } } }
  ]);

  // Get participant details for those with votes
  const participantIds = votes.map(v => v._id);
  const participants = await Participant.find({ _id: { $in: participantIds } }).lean();

  // Build leaderboard and track viewer
  let viewer = null;
  const mappedParticipants = votes
    .map(v => {
      const participant = participants.find(p => p._id.toString() === v._id.toString());
      if (!participant) return null;
      const participantData = {
        id: v._id.toString(),
        name: participant.user.first_name + (participant.user.last_name ? ` ${participant.user.last_name}` : ''),
        photo_url: participant.user.photo_url,
        voteCount: v.voteCount,
        participatedOn: participant.participatedOn
      };
      // Set viewer data if this participant matches viewerId
      if (participant.user.id.toString() === viewerId.toString()) {
        viewer = { ...participantData, rank: 0 }; // Placeholder rank
      }
      return participantData;
    })
    .filter(Boolean);

  // Sort and assign viewer rank in one pass
  let viewerRank = 0;
  const leaderboard = mappedParticipants
    .sort((a, b) => b.voteCount - a.voteCount || a.participatedOn - b.participatedOn)
    .map((p, index) => {
      // Update viewer rank if this is the viewer
      if (viewer && p.id === viewer.id) {
        viewerRank = index + 1;
      }
      return p; // No rank field in leaderboard
    });

  // Update viewer rank if found in leaderboard
  if (viewer) {
    viewer.rank = viewerRank;
  }

  // If viewer not found (no votes), fetch from DB and set hypothetical rank
  if (!viewer) {
    const viewerParticipant = await Participant.findOne({ giveawayId, 'user.id': viewerId }).lean();
    if (viewerParticipant) {
      viewer = {
        id: viewerParticipant._id.toString(),
        name: viewerParticipant.user.first_name + (viewerParticipant.user.last_name ? ` ${viewerParticipant.user.last_name}` : ''),
        photo_url: viewerParticipant.user.photo_url,
        voteCount: 0,
        participatedOn: viewerParticipant.participatedOn
      };
    }
  }

  // Count eligible winners based on minVotes (from leaderboard only)
  const eligibleWinnersCount = leaderboard.filter(p => p.voteCount >= minVotes).length;

  return {
    leaderboard, // Only participants with voteCount > 0, no rank field
    viewer, // Viewer data if participant (with rank), else null
    eligibleWinnersCount
  };
}