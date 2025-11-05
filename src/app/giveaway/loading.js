
"use client";

import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import styles from "@/styles/giveaway.module.css";

// ChatSkeleton Wrapper Component
function RewardsSkeleton({ children }) {
  return (
    <div className={styles.box}>
        <div className={styles.boxHeading}>
            <Skeleton width={150} />
        </div>
    </div>
  );
}

export default function GiveawayLoading() {
  return (
    <main className={styles.main}>
        <div className={styles.head}>
            <Skeleton circle width={100} height={100} />
            <Skeleton width={200} height={30} />
            <Skeleton width={150} />
        </div>

        <div className={styles.boxContainer}>
            <div className={styles.box}>
                <p><Skeleton width={100} /></p>
                <p><Skeleton width={50} /></p>
            </div>
            <div className={styles.box}>
                <p><Skeleton width={100} /></p>
                <p><Skeleton width={50} /></p>
            </div>
        </div>
        <p className={styles.help}><Skeleton width={250} /></p>
        
        <div className={styles.container}>
            <div className={styles.rewardsPanel}>
                <h4 className={`${styles.heading} ${styles.rewardsHeading}`}><Skeleton width={100} /></h4>
                <Skeleton wrapper={RewardsSkeleton} count={3} />
            </div>
        </div>
        <p className={styles.help}><Skeleton width={200} /></p>

        <div className={`${styles.container} ${styles.btn}`}>
            <Skeleton height={50} borderRadius={10} />
        </div>
    </main>
  );
}
