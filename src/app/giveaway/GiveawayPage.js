"use client";

import Image from "next/image";
import styles from "@/styles/giveaway.module.css";
import { FaChevronDown } from "react-icons/fa";
import { getGiveaway } from "@/actions/giveaway";
import { useState, useEffect, useRef, useTransition, useOptimistic, useMemo } from "react";
import { addParticipant, getParticipantsCount } from "@/actions/participant";
import { useRouter } from "next/navigation";
import ListItem from "@/components/List";
import BottomSheetModal from "@/components/BottomSheetModal";
import Leaderboard from "@/components/Leaderboard";
import { getLeaderboard } from "@/actions/leaderboard";
import { isUserChatBooster, isUserChatMember } from "@/actions/bot";
import { addSystemChannel, formatLocalTimestamp, getStatus } from "@/lib/functions";
import { motion } from "framer-motion";

// Constants for environment variables
const BOT_USERNAME = process.env.NEXT_PUBLIC_BOT_USERNAME;

function Rewards({ winnerIndex, rewards }) {
    const [isOpen, setIsOpen] = useState(false);

    const handleToggle = () => {
        setIsOpen(!isOpen);
    };

    return (
        <motion.div 
            className={styles.box}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
        >
            <h4 className={`${styles.boxHeading} ${isOpen ? styles.open : ""}`} onClick={handleToggle}>
                <span>Rewards for winner #{winnerIndex}</span>
                <FaChevronDown />
            </h4>

            {isOpen && (
                <ol className={styles.rewards}>
                    {rewards.map((reward, i) => (
                        <li key={i} className={styles.rewardRow}>
                            <span className={styles.rewardIndex}>{i + 1}</span>
                            <span>{reward}</span>
                        </li>
                    ))}
                </ol>
            )}
        </motion.div>
    );
}

function GiveawayDetails({
    telegram,
    giveawayId,
    giveaway,
    user,
    setHasFetched,
    subscribeChats,
    boostChats,
    handleClickSubscribeCheck,
    handleClickBoostCheck,
    participantId,
    participantsCount,
    setParticipantState,
    statusInfo,
}) {
    const router = useRouter();
    const [isChatsModalOpen, setIsChatsModalOpen] = useState(false);
    const [isChatBoostsModalOpen, setIsChatBoostsModalOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [optimisticState, setOptimisticState] = useOptimistic(
        { participantId, participantsCount },
        (currentState, newParticipantId) => ({
            participantId: newParticipantId,
            participantsCount: currentState.participantsCount + 1,
        })
    );

    const handleClick = () => {
        if (!user) {
            telegram.showAlert("User not authenticated.");
            return;
        }

        if (giveaway.pRequirements.chatMember && subscribeChats.some((chat) => chat.status !== "success")) {
            telegram.showAlert("Subscribe to all mentioned chats above.");
            return;
        }

        if (giveaway.pRequirements.premiumUser && !user.is_premium) {
            telegram.showAlert("Only Telegram premium users can participate.");
            return;
        }

        if (giveaway.pRequirements.chatBooster && boostChats.some((chat) => chat.status !== "success")) {
            telegram.showAlert("Boost all mentioned chats above.");
            return;
        }

        startTransition(async () => {
            setOptimisticState("pending"); // Optimistic update: increment participantsCount

            try {
                const result = await addParticipant({ giveawayId, user });
                if (result.error) {
                    setParticipantState({ id: result.id, count: optimisticState.participantsCount });
                    telegram.showAlert(result.message);
                    setOptimisticState(null); // Revert optimistic update
                    return;
                }
                // Update real state with participantId and optimistic count
                setParticipantState({
                    id: result.id,
                    count: optimisticState.participantsCount + 1,
                });
                setHasFetched(false);
                router.push(`/participant?id=${result.id}`);
            } catch (err) {
                console.error("Error participating in giveaway:", err);
                telegram.showAlert("An error occurred while participating. Please try again.");
                setOptimisticState(null); // Revert optimistic update
            }
        });
    };

    return (
        <motion.div 
            className={styles.bodyContent}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
        >
            {Object.keys(giveaway.rewards).length > 0 && (
                <>
                    <motion.div 
                        className={styles.container}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        <h4 className={`${styles.heading} ${styles.rewardsHeading}`}>Rewards for Winners</h4>
                        <div className={styles.rewardsPanel}>
                            {Object.entries(giveaway.rewards).map(([key, value]) => (
                                <Rewards key={key} winnerIndex={key} rewards={value} />
                            ))}
                        </div>
                    </motion.div>
                    <p className={styles.help}>Rewards that each winner will receive after the giveaway ends.</p>
                </>
            )}

            <motion.div 
                className={styles.container}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                <h4 className={styles.heading}>Participation Requirements</h4>
                <div className={styles.list}>
                    {giveaway.pRequirements.chatMember && (
                        <ListItem
                            image="/channel.svg"
                            title="Subscribe"
                            paragraph="Follow required Channels or Groups"
                            onClick={() => setIsChatsModalOpen(true)}
                        />
                    )}
                    {giveaway.pRequirements.premiumUser && (
                        <ListItem
                            image="/premium.svg"
                            title="Telegram Premium"
                            paragraph="Premium subscription required"
                        />
                    )}
                    {giveaway.pRequirements.chatBooster && (
                        <ListItem
                            image="/boost.svg"
                            title="Boost"
                            paragraph="Boost required Channels or Groups"
                            onClick={() => setIsChatBoostsModalOpen(true)}
                        />
                    )}
                </div>
            </motion.div>
            <p className={styles.help}>Users must meet these conditions to participate.</p>
            {giveaway.pRequirements.chatMember && (
                <BottomSheetModal
                    title="Subscribe"
                    options={subscribeChats}
                    isOpen={isChatsModalOpen}
                    setIsOpen={setIsChatsModalOpen}
                    isCheckClickable={(statusInfo.status === "Ongoing") && !optimisticState.participantId}
                    handleClick={handleClickSubscribeCheck}
                />
            )}
            {giveaway.pRequirements.chatBooster && (
                <BottomSheetModal
                    title="Boost Chats"
                    options={boostChats}
                    isOpen={isChatBoostsModalOpen}
                    setIsOpen={setIsChatBoostsModalOpen}
                    isCheckClickable={(statusInfo.status === "Ongoing") && !optimisticState.participantId}
                    handleClick={handleClickBoostCheck}
                />
            )}

            <motion.div 
                className={styles.boxContainer}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
            >
                <div className={styles.box}>
                    <p>Minimum Votes Needed</p>
                    <p>{giveaway.minVotes.toLocaleString()}</p>
                </div>
            </motion.div>
            <p className={`${styles.help} ${styles.bold}`}>
                You need a minimum of {giveaway.minVotes} votes to be considered for rewards.
            </p>

            <motion.div 
                className={styles.boxContainer}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
            >
                <div className={styles.box}>
                    <p>Start Time</p>
                    <p>{formatLocalTimestamp(giveaway.startTime * 1000)}</p>
                </div>
                <div className={styles.box}>
                    <p>End Time</p>
                    <p>{formatLocalTimestamp(giveaway.endTime * 1000)}</p>
                </div>
            </motion.div>
            <p className={styles.help}>The start and end time of the giveaway in your local time.</p>

            <div className={styles.label}>
                <span>Current Status</span>
                <span className={`${styles.status} ${statusInfo.color}`}>
                    <span></span>
                    <span>{statusInfo.status}</span>
                </span>
            </div>

            <motion.div 
                className={`${styles.container} ${styles.btn}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
            >
                <button
                    className={styles.button}
                    onClick={handleClick}
                    disabled={
                        isPending ||
                        !!optimisticState.participantId ||
                        statusInfo.status !== "Ongoing"
                    }
                >
                    {isPending ? (
                        <div className={styles.spinner}></div>
                    ) : optimisticState.participantId ? (
                        "Participated"
                    ) : (
                        "Participate"
                    )}
                </button>
                {optimisticState.participantId && (
                    <button
                        className={styles.button}
                        onClick={() => router.push(`/participant?id=${optimisticState.participantId}`)}
                    >
                        View Post
                    </button>
                )}
            </motion.div>
            <motion.div 
                className={`${styles.container} ${styles.btn}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
            >
                <button
                    className={styles.button}
                    onClick={() => {
                        navigator.clipboard.writeText(
                            `https://t.me/${BOT_USERNAME}/giveaway?startapp=${giveawayId}`
                        );
                        telegram.showAlert("Giveaway link copied to clipboard.");
                    }}
                >
                    Share Giveaway
                </button>
            </motion.div>
        </motion.div>
    );
}

export default function GiveawayPage({ initialGiveawayId }) {
    const [telegram, setTelegram] = useState(null);
    const [user, setUser] = useState(null);
    const [giveawayId, setGiveawayId] = useState(initialGiveawayId);
    const [participantState, setParticipantState] = useState({ id: null, count: 0 });
    const [giveaway, setGiveaway] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState("option1");
    const [leaderboardData, setLeaderboardData] = useState([]);
    const [hasFetched, setHasFetched] = useState(false);
    const [isLoading, startTransition] = useTransition();
    const [subscribeChats, setSubscribeChats] = useState([]);
    const [boostChats, setBoostChats] = useState([]);
    const lineRef = useRef(null);

    // Cache getStatus result with useMemo
    const statusInfo = useMemo(() => {
        if (!giveaway) return { status: "Unknown", color: "" };
        return getStatus(giveaway.startTime, giveaway.endTime);
    }, [giveaway?.startTime, giveaway?.endTime]);

    const handleClickSubscribeCheck = async (setModalLoading) => {
        if (!user?.id) return;

        setModalLoading(true);
        try {
            const updatedChats = await Promise.all(
                subscribeChats.map(async (chat) => {
                    const isMember = await isUserChatMember(chat.id, user.id, chat.isSystem === true);
                    return { ...chat, status: isMember ? "success" : "failed" };
                })
            );
            setSubscribeChats(updatedChats);
        } catch (error) {
            console.error("Error in getChatMember", error);
            telegram?.showAlert("Failed to check chat membership. Please try again.");
        } finally {
            setModalLoading(false);
        }
    };

    const handleClickBoostCheck = async (setModalLoading) => {
        if (!user?.id) return;

        setModalLoading(true);
        try {
            const updatedChats = await Promise.all(
                boostChats.map(async (chat) => {
                    const isBooster = await isUserChatBooster(chat.id, user.id);
                    return { ...chat, status: isBooster ? "success" : "failed" };
                })
            );
            setBoostChats(updatedChats);
        } catch (error) {
            console.error("Error in getChatBooster", error);
            telegram?.showAlert("Failed to check chat boosts. Please try again.");
        } finally {
            setModalLoading(false);
        }
    };

    const handleRadioChange = (e) => {
        const label = e.target.closest("label");
        if (!label || !lineRef.current) return;

        lineRef.current.style.width = `${label.offsetWidth}px`;
        lineRef.current.style.left = `${label.offsetLeft}px`;

        setSelected(e.target.value);
    };

    useEffect(() => {
        if (selected === "option2" && !hasFetched && user?.id && giveaway?.minVotes) {
            startTransition(async () => {
                try {
                    const data = await getLeaderboard(giveawayId, user.id, giveaway.minVotes);
                    setLeaderboardData(data);
                    setHasFetched(true);
                } catch (error) {
                    console.error("Failed to fetch leaderboard:", error);
                    telegram?.showAlert("Failed to load leaderboard. Please try again.");
                }
            });
        }
    }, [selected, hasFetched, giveawayId, user?.id, giveaway?.minVotes]);

    useEffect(() => {
        setHasFetched(false);
    }, [giveawayId, user?.id]);

    useEffect(() => {
        async function fetchGiveaway() {
            if (!giveawayId || !user) return;

            setLoading(true);
            try {
                const data = await getGiveaway(giveawayId);
                const participantsCount = await getParticipantsCount(giveawayId, user.id);
                setParticipantState({ id: participantsCount.id, count: participantsCount.count });

                const chatsWithSystem =
                    process.env.NEXT_PUBLIC_ADD_SYSTEM_CHANNEL === "true"
                        ? addSystemChannel(data.chats)
                        : data.chats;

                setBoostChats(data.chats);
                setSubscribeChats(chatsWithSystem);
                setGiveaway(data);
            } catch (err) {
                console.error("Error fetching giveaway:", err);
                telegram?.showAlert("Failed to load giveaway. Please try again.");
            } finally {
                setLoading(false);
                telegram?.ready();
            }
        }

        fetchGiveaway();
    }, [giveawayId, user, telegram]);

    useEffect(() => {
        if (typeof window !== "undefined" && window.Telegram?.WebApp) {
            const tg = window.Telegram.WebApp;
            if (!giveawayId && tg.initDataUnsafe.start_param) {
                setGiveawayId(tg.initDataUnsafe.start_param);
            }
            setTelegram(tg);
            setUser(tg.initDataUnsafe?.user || null);
        }
    }, [giveawayId]);

    if (loading) return <div>Loading...</div>;

    if (!giveaway) return <div>Giveaway not found</div>;

    return (
        <main className={styles.main}>
            <motion.div 
                className={styles.head}
                initial={{ opacity: 0, y: -50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <Image
                    src="/starIcon.png"
                    width={100}
                    height={100}
                    alt="Star Icon"
                    priority
                    sizes="(max-width: 768px) 100vw, 100px"
                    draggable={false}
                />
                <h2>Giveaway Details</h2>
                <p>Join this giveaway and earn exciting rewards.</p>
            </motion.div>

            <motion.div 
                className={styles.boxContainer}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
            >
                <div className={styles.box}>
                    <p>Total Winners</p>
                    <p>{giveaway.numWinners.toLocaleString()}</p>
                </div>
                {statusInfo.status !== "Upcoming" && (
                    <div className={styles.box}>
                        <p>Participants</p>
                        <p>{participantState.count.toLocaleString()}</p>
                    </div>
                )}
            </motion.div>
            <p className={styles.help}>This giveaway will have {giveaway.numWinners} winners.</p>

            <div className={styles.body}>
                <div className={styles.tabsWrapper}>
                    <div className={styles.tabs}>
                        <div className={styles.tabOptions}>
                            <label>
                                <input
                                    type="radio"
                                    name="tab"
                                    value="option1"
                                    checked={selected === "option1"}
                                    onChange={handleRadioChange}
                                />
                                Details
                            </label>
                            <label>
                                <input
                                    type="radio"
                                    name="tab"
                                    value="option2"
                                    checked={selected === "option2"}
                                    onChange={handleRadioChange}
                                />
                                Leaderboard
                            </label>
                        </div>
                        <span className={styles.line} ref={lineRef}></span>
                    </div>
                </div>
                {selected === "option1" ? (
                    <GiveawayDetails
                        telegram={telegram}
                        giveawayId={giveawayId}
                        giveaway={giveaway}
                        user={user}
                        setHasFetched={setHasFetched}
                        subscribeChats={subscribeChats}
                        boostChats={boostChats}
                        handleClickSubscribeCheck={handleClickSubscribeCheck}
                        handleClickBoostCheck={handleClickBoostCheck}
                        participantId={participantState.id}
                        participantsCount={participantState.count}
                        setParticipantState={setParticipantState}
                        statusInfo={statusInfo}
                    />
                ) : (
                    <Leaderboard leaderboardData={leaderboardData} isLoading={isLoading} />
                )}
            </div>
        </main>
    );
}
