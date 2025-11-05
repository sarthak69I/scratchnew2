
"use client";

import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import styles from "@/styles/giveaway.module.css";

export default function ParticipantLoading() {
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

        <div className={styles.body}>
            <div className={styles.tabsWrapper}>
                <div className={styles.tabs}>
                    <div className={styles.tabOptions}>
                        <Skeleton width={70} height={30} />
                        <Skeleton width={70} height={30} />
                    </div>
                </div>
            </div>
            <div className={styles.container}>
                <h4 className={styles.heading}><Skeleton width={150} /></h4>
                <div className={styles.list}>
                    <Skeleton height={50} count={2} style={{ margin: '10px 0' }} />
                </div>
            </div>
            <p className={styles.help}><Skeleton width={200} /></p>

            <div className={`${styles.container} ${styles.btn}`}>
                <Skeleton height={50} borderRadius={10} />
                <Skeleton height={50} borderRadius={10} />
            </div>
        </div>
    </main>
  );
}
