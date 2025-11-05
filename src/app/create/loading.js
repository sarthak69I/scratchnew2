
"use client";

import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import styles from "@/styles/create.module.css";

// ChatSkeleton Wrapper Component
function ChatSkeleton({ children }) {
    return (
      <div className={styles.chat}>
        <Skeleton circle width={45} height={45} containerClassName={styles.chatImage} />
        <Skeleton containerClassName={styles.title} />
      </div>
    );
}

export default function CreateGiveawayLoading() {
  return (
    <main className={styles.main}>
        <div className={styles.head}>
            <Skeleton circle width={100} height={100} />
            <Skeleton width={200} height={30} />
            <Skeleton width={250} />
        </div>

        <div className={styles.container}>
            <h4 className={styles.heading}><Skeleton width={150} /></h4>
            <div className={styles.chats}>
                <Skeleton wrapper={ChatSkeleton} count={1} containerClassName={styles.chatSkeletonContainer} />
            </div>
        </div>
        <p className={styles.help}><Skeleton width={300} /></p>

        <div className={styles.container}>
            <label className={styles.heading}><Skeleton width={120} /></label>
            <div className={styles.inp}>
                <Skeleton height={30} />
            </div>
        </div>
        <p className={styles.help}><Skeleton width={200} /></p>

        <div className={styles.container}>
            <label className={styles.heading}><Skeleton width={150} /></label>
            <div className={styles.inp}>
                <Skeleton height={30} />
            </div>
        </div>
        <p className={styles.help}><Skeleton width={280} /></p>

        <div className={styles.container}>
            <h4 className={styles.heading}><Skeleton width={200} /></h4>
            <Skeleton height={40} count={3} style={{ margin: '10px 0' }} />
        </div>
        <p className={styles.help}><Skeleton width={260} /></p>

        <div className={`${styles.container} ${styles.btn}`}>
            <Skeleton height={50} borderRadius={10} />
        </div>
    </main>
  );
}
