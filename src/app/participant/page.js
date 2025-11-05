import { Suspense } from "react";
import ParticipantPage from "./ParticipantPage";

export default async function Page({ searchParams }) {
  const participantId = (await searchParams).id;

  return (
    <Suspense fallback={<p>Loading...</p>}>
      <ParticipantPage initialParticipantId={participantId} />
    </Suspense>
  );
}
