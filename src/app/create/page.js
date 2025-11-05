import { Suspense } from "react";
import { Chat } from "@/models/Chat";
import { connectDB } from "@/lib/mongoose";
import CreateGiveawayPage from "./CreateGiveawayPage";


async function getChatsByIds(chatIds) {
  await connectDB();

  if (!Array.isArray(chatIds) || chatIds.length === 0) return [];

  const chats = await Chat.find({ id: { $in: chatIds } })
    .select('id title link photo type -_id') // only needed fields
    .lean(); // convert Mongoose docs to plain JS objects

  return chats;
}


export default async function Page({ searchParams }) {
  // Extract chatIds from searchParams
  const chatIds = (await searchParams).chatIds
    ?.split(",")
    .filter(id => id.trim() !== "")
    .map(Number)
    .filter(id => !isNaN(id)) || [];

  // Fetch chats on the server
  let chats = [];
  try {
    chats = (await getChatsByIds([...new Set(chatIds)])) || [];
  } catch (err) {
    console.error("Failed to fetch chats:", err);
  }

  return (
    <Suspense fallback={<p>Loading...</p>}>
      <CreateGiveawayPage chats={chats} />
    </Suspense>
  );
}