'use client';

import Image from 'next/image';
import styles from '@/styles/leaderboard.module.css';
import { useRouter } from 'next/navigation';
import { PiArrowFatUpFill } from "react-icons/pi";
import { IoIosInformationCircleOutline } from "react-icons/io";
import { Fragment } from 'react';

export default function Leaderboard({ leaderboardData, isLoading }) {
  const router = useRouter();

  if (isLoading) return <p className={styles.empty}>Loading...</p>;

  return (
    <div className={styles.bodyContent}>
      {
        (leaderboardData.leaderboard?.length > 0) && (
          <p className={styles.eligibleWinnersInfo}>
            <IoIosInformationCircleOutline />
            <span>
              {
                (leaderboardData.eligibleWinnersCount == 0) ?
                  `No one is eligible to be a winner.`
                  :
                  (leaderboardData.eligibleWinnersCount == 1) ?
                    `${leaderboardData.eligibleWinnersCount} participant is eligible for selection as winner.`
                    :
                    `${leaderboardData.eligibleWinnersCount} participants are eligible for selection as winners.`
              }
            </span>
          </p>
        )
      }

      <div className={styles.leaderList}>
        {
          leaderboardData.leaderboard?.length ?
            leaderboardData.leaderboard.map((p, index) => (
              <Fragment key={index}>
                <button
                  onClick={() => { router.push(`/participant?id=${p.id}`) }}
                  className={`${styles.participantRow} ${(p.id === leaderboardData.viewer?.id) ? styles.me : ''}`} // keep styling
                >
                  <span className={styles.rank}>{index + 1}</span>
                  <Image
                    src={p.photo_url || '/default.png'}
                    alt={p.name}
                    width={40}
                    height={40}
                    className={styles.participantPfp}
                    draggable={false}
                  />
                  <span className={styles.participantName}>{p.name}</span>
                  <span className={styles.voteCount}>{p.voteCount} Votes</span>
                </button>
                {
                  (index + 1 === leaderboardData.eligibleWinnersCount) && <div className={styles.eligibleWinnersHeading}>
                    <PiArrowFatUpFill />
                    <span>WINNER ELIGIBLE</span>
                    <PiArrowFatUpFill />
                  </div>
                }
              </Fragment>
            )) :
            <p className={styles.empty}>No votes yet.</p>
        }
      </div>

      {leaderboardData.viewer && (
        <div className={styles.viewerFixed}>
          <button onClick={() => { router.push(`/participant?id=${leaderboardData.viewer.id}`) }} className={styles.participantRow}>
            <span className={styles.rank}>
              {(leaderboardData.viewer.voteCount > 0) ? leaderboardData.viewer.rank : '–'}
            </span>
            <Image
              src={leaderboardData.viewer.photo_url || '/default.png'}
              alt={leaderboardData.viewer.name}
              width={40}
              height={40}
              className={styles.participantPfp}
              draggable={false}
            />
            <span className={styles.participantName}>You ({leaderboardData.viewer.name})</span>
            <span className={styles.voteCount}>{leaderboardData.viewer.voteCount} Votes</span>
          </button>
        </div>
      )}
    </div>
  );
}