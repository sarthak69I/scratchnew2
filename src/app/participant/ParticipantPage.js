"use client";

import Image from "next/image";
import styles from "@/styles/giveaway.module.css";
import { MdKeyboardDoubleArrowRight } from "react-icons/md";
import { getGiveaway } from "@/actions/giveaway";
import { useState, useEffect, useRef, useTransition, useOptimistic, useMemo } from "react";
import { getParticipant, getParticipantsCount } from "@/actions/participant";
import { useRouter } from "next/navigation";
import ListItem from "@/components/List";
import BottomSheetModal from "@/components/BottomSheetModal";
import VoterList from "@/components/VoterList";
import { addVoter, getVotersCount, getVotersList } from "@/actions/voter";
import { isUserChatBooster, isUserChatMember } from "@/actions/bot";
import { addSystemChannel, formatLocalTimestamp, getStatus } from "@/lib/functions";
import { motion } from "framer-motion";

// Constants for environment variables
const BOT_USERNAME = process.env.NEXT_PUBLIC_BOT_USERNAME;

function ParticipantDetails({
    telegram,
    giveawayId,
    giveaway,
    participantId,
    participant,
    setParticipant,
    user,
    setHasFetched,
    subscribeChats,
    boostChats,
    handleClickSubscribeCheck,
    handleClickBoostCheck,
    isVoted,
    setIsVoted,
    voterState,
    setVoterState,
    statusInfo,
}) {
    const router = useRouter();
    const [isChatsModalOpen, setIsChatsModalOpen] = useState(false);
    const [isChatBoostsModalOpen, setIsChatBoostsModalOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [optimisticState, setOptimisticState] = useOptimistic(
        { isVoted, voteCount: voterState.voteCount },
        (currentState) => ({
            isVoted: true,
            voteCount: currentState.voteCount + 1,
        })
    );

    const handleClick = () => {
        if (!user) {
            telegram.showAlert("User not authenticated.");
            return;
        }

        if (giveaway.vRequirements.chatMember && subscribeChats.some((chat) => chat.status !== "success")) {
            telegram.showAlert("Subscribe to all mentioned chats above.");
            return;
        }

        if (giveaway.vRequirements.premiumUser && !user.is_premium) {
            telegram.showAlert("Only Telegram premium users can vote.");
            return;
        }

        if (giveaway.vRequirements.chatBooster && boostChats.some((chat) => chat.status !== "success")) {
            telegram.showAlert("Boost all mentioned chats above.");
            return;
        }

        startTransition(async () => {
            setOptimisticState({}); // Optimistic update: set isVoted true, increment voteCount

            try {
                const result = await addVoter({ giveawayId, participantId, user });
                if (result.error) {
                    setVoterState({ voteCount: optimisticState.voteCount, rank: voterState.rank });
                    setIsVoted(true);
                    telegram.showAlert(result.message);
                    setOptimisticState(null); // Revert optimistic update
                    return;
                }

                // Fetch updated vote count and rank
                const vcData = await getVotersCount(giveawayId, participantId, user.id);
                setVoterState({ voteCount: vcData.voteCount, rank: vcData.rank });
                setIsVoted(true);
                setHasFetched(false);
                telegram.showAlert("Successfully Voted.");
            } catch (err) {
                console.error("Error voting in giveaway:", err);
                telegram.showAlert("An error occurred while voting. Please try again.");
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
            <motion.div 
                className={styles.container}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
            >
                <h4 className={styles.heading}>Voting Requirements</h4>
                <div className={styles.list}>
                    {giveaway.vRequirements.chatMember && (
                        <ListItem
                            image="/channel.svg"
                            title="Subscribe"
                            paragraph="Follow required Channels or Groups"
                            onClick={() => setIsChatsModalOpen(true)}
                        />
                    )}
                    {giveaway.vRequirements.premiumUser && (
                        <ListItem
                            image="/premium.svg"
                            title="Telegram Premium"
                            paragraph="Premium subscription required"
                        />
                    )}
                    {giveaway.vRequirements.chatBooster && (
                        <ListItem
                            image="/boost.svg"
                            title="Boost"
                            paragraph="Boost required Channels or Groups"
                            onClick={() => setIsChatBoostsModalOpen(true)}
                        />
                    )}
                </div>
            </motion.div>
            <p className={styles.help}>Users must meet these conditions to vote for this participant.</p>
            {giveaway.vRequirements.chatMember && (
                <BottomSheetModal
                    title="Subscribe"
                    options={subscribeChats}
                    isOpen={isChatsModalOpen}
                    setIsOpen={setIsChatsModalOpen}
                    isCheckClickable={(statusInfo.status === "Ongoing") && !optimisticState.isVoted}
                    handleClick={handleClickSubscribeCheck}
                />
            )}
            {giveaway.vRequirements.chatBooster && (
                <BottomSheetModal
                    title="Boost Chats"
                    options={boostChats}
                    isOpen={isChatBoostsModalOpen}
                    setIsOpen={setIsChatBoostsModalOpen}
                    isCheckClickable={(statusInfo.status === "Ongoing") && !optimisticState.isVoted}
                    handleClick={handleClickBoostCheck}
                />
            )}

            <motion.div 
                className={styles.boxContainer}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                <div className={styles.box}>
                    <p>Participated On</p>
                    <p>{formatLocalTimestamp(participant.participatedOn * 1000)}</p>
                </div>
            </motion.div>
            <p className={styles.help}>The date and time when this participant joined the giveaway.</p>

            <motion.div 
                className={styles.linkContainer}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
            >
                <button
                    className={styles.link}
                    onClick={() => router.push(`/giveaway?id=${giveawayId}`)}
                >
                    <span>Giveaway Details</span>
                    <MdKeyboardDoubleArrowRight />
                </button>
                <button
                    className={styles.link}
                    onClick={() => router.push(`/giveaway?id=${giveawayId}`)}
                >
                    <span>Participate</span>
                    <MdKeyboardDoubleArrowRight />
                </button>
            </motion.div>

            <motion.div 
                className={`${styles.container} ${styles.btn}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
            >
                <button
                    className={styles.button}
                    onClick={handleClick}
                    disabled={isPending || optimisticState.isVoted || statusInfo.status !== "Ongoing"}
                >
                    {isPending ? <div className={styles.spinner}></div> : optimisticState.isVoted ? "Voted" : "Vote"}
                </button>
                <button
                    className={styles.button}
                    onClick={() => {
                        navigator.clipboard.writeText(
                            `https://t.me/${BOT_USERNAME}/participant?startapp=${participantId}`
                        );
                        telegram.showAlert("Post link copied to clipboard.");
                    }}
                >
                    Share Post
                </button>
            </motion.div>
        </motion.div>
    );
}

export default function ParticipantPage({ initialParticipantId }) {
    const [telegram, setTelegram] = useState(null);
    const [user, setUser] = useState(null);
    const [giveawayId, setGiveawayId] = useState(null);
    const [giveaway, setGiveaway] = useState(null);
    const [participantId, setParticipantId] = useState(initialParticipantId);
    const [participant, setParticipant] = useState(null);
    const [voterState, setVoterState] = useState({ voteCount: 0, rank: null });
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState("option1");
    const [voters, setVoters] = useState([]);
    const [viewer, setViewer] = useState(null);
    const [hasFetched, setHasFetched] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isVoted, setIsVoted] = useState(false);
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
        if (selected === "option2" && !hasFetched) {
            const fetchData = async () => {
                setIsLoading(true);
                try {
                    const data = await getVotersList(giveawayId, participantId, user.id);
                    const viewerData = data.find((p) => p.isViewer);
                    setViewer(viewerData || null);
                    setVoters(data);
                    setHasFetched(true);
                } catch (error) {
                    console.error("Failed to fetch voters list:", error);
                    telegram?.showAlert("Failed to load voters list. Please try again.");
                } finally {
                    setIsLoading(false);
                }
            };
            fetchData();
        }
    }, [selected, hasFetched, giveawayId, participantId, user?.id]);

    useEffect(() => {
        setHasFetched(false);
    }, [giveawayId, user?.id]);

    useEffect(() => {
        async function fetchParticipant() {
            if (!participantId || !user?.id) return;

            setLoading(true);
            try {
                const pData = await getParticipant(participantId);
                const vcData = await getVotersCount(pData.giveawayId, participantId, user.id);
                setIsVoted(vcData.isVoted);
                setVoterState({ voteCount: vcData.voteCount, rank: vcData.rank });
                setParticipant({ user: pData.user, participatedOn: pData.participatedOn });
                setGiveawayId(pData.giveawayId);
                const data = await getGiveaway(pData.giveawayId);
                const participantsCount = await getParticipantsCount(pData.giveawayId, user.id);
                data.participantsCount = participantsCount.count;

                const chatsWithSystem =
                    process.env.NEXT_PUBLIC_ADD_SYSTEM_CHANNEL === "true"
                        ? addSystemChannel(data.chats)
                        : data.chats;

                setBoostChats(data.chats);
                setSubscribeChats(chatsWithSystem);
                setGiveaway(data);
            } catch (err) {
                console.error("Error fetching participant:", err);
                telegram?.showAlert("Failed to load participant data. Please try again.");
            } finally {
                setLoading(false);
                telegram?.ready();
            }
        }

        fetchParticipant();
    }, [participantId, user?.id]);

    useEffect(() => {
        if (typeof window !== "undefined" && window.Telegram?.WebApp) {
            const tg = window.Telegram.WebApp;
            if (!participantId && tg.initDataUnsafe.start_param) {
                setParticipantId(tg.initDataUnsafe.start_param);
            }
            setTelegram(tg);
            setUser(tg.initDataUnsafe?.user || null);
        }
    }, []);

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
                    className={styles.round}
                    src={participant.user.photo_url}
                    width={100}
                    height={100}
                    alt="User"
                    draggable={false}
                    priority
                />
                <h2>
                    {participant.user.last_name
                        ? `${participant.user.first_name} ${participant.user.last_name}`
                        : participant.user.first_name}
                </h2>
                <p>{participant.user.username ? `@${participant.user.username}` : "No Username"}</p>
            </motion.div>

            <motion.div 
                className={styles.boxContainer}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
            >
                <div className={styles.box}>
                    <p>Total Voters</p>
                    <p>{voterState.voteCount.toLocaleString()}</p>
                </div>
                <div className={styles.box}>
                    <p>Rank</p>
                    <p>{voterState.rank !== null ? voterState.rank : "–"}</p>
                </div>
            </motion.div>
            <p className={styles.help}>The participant’s current voting stats in this giveaway.</p>

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
                                Voters
                            </label>
                        </div>
                        <span className={styles.line} ref={lineRef}></span>
                    </div>
                </div>
                {selected === "option1" ? (
                    <ParticipantDetails
                        telegram={telegram}
                        giveawayId={giveawayId}
                        giveaway={giveaway}
                        participantId={participantId}
                        participant={participant}
                        setParticipant={setParticipant}
                        user={user}
                        setHasFetched={setHasFetched}
                        subscribeChats={subscribeChats}
                        boostChats={boostChats}
                        handleClickSubscribeCheck={handleClickSubscribeCheck}
                        handleClickBoostCheck={handleClickBoostCheck}
                        isVoted={isVoted}
                        setIsVoted={setIsVoted}
                        voterState={voterState}
                        setVoterState={setVoterState}
                        statusInfo={statusInfo}
                    />
                ) : (
                    <VoterList voters={voters} viewer={viewer} isLoading={isLoading} />
                )}
            </div>
        </main>
    );
}
