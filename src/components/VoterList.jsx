'use client';

import Image from 'next/image';
import styles from '@/styles/leaderboard.module.css';
import { formatLocalTimestamp } from '@/lib/functions';


export default function VoterList({ voters, viewer, isLoading }) {
  if (isLoading) return <p className={styles.empty}>Loading...</p>;
  
  if (!voters.length && !viewer) return <p className={styles.empty}>No votes yet.</p>;

  return (
    <div className={styles.bodyContent}>
      <div className={styles.leaderList}>
        {voters?.map((v, index) => (
          <div
            key={index}
            className={`${styles.participantRow} ${v.isViewer ? styles.me : ''}`} // keep styling
          >
            <span className={styles.rank}>{index + 1}</span>
            <Image
              src={v.photo_url || '/default.png'}
              alt={v.name}
              width={40}
              height={40}
              className={styles.participantPfp}
              draggable={false}
            />
            <span className={styles.participantName}>{v.name}</span>
            <span className={styles.voteCount}>{formatLocalTimestamp(v.votedOn * 1000)}</span>
          </div>
        ))}
      </div>

      {viewer && (
        <div className={styles.viewerFixed}>
          <div className={styles.participantRow}>
            <span className={styles.rank}>
              {voters.findIndex(v => v.id === viewer.id) + 1}
            </span>
            <Image
              src={viewer.photo_url || '/default.png'}
              alt={viewer.name}
              width={40}
              height={40}
              className={styles.participantPfp}
              draggable={false}
            />
            <span className={styles.participantName}>You ({viewer.name})</span>
            <span className={styles.voteCount}>{formatLocalTimestamp(viewer.votedOn * 1000)}</span>
          </div>
        </div>
      )}
    </div>
  );
}