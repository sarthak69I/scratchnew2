import { Suspense } from "react";
import GiveawayPage from "./GiveawayPage";

export default async function Page({ searchParams }) {
  const giveawayId = (await searchParams).id;

  return (
    <Suspense fallback={<p>Loading...</p>}>
      <GiveawayPage initialGiveawayId={giveawayId} />
    </Suspense>
  );
}
