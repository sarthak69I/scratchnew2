"use client";

import Image from "next/image";
import Skeleton from "react-loading-skeleton";
import styles from "@/styles/create.module.css";
import DateTimePicker from "@/components/DateTimePicker";
import { RxCross2 } from "react-icons/rx";
import { FaChevronDown } from "react-icons/fa";
import { sendMessage } from "@/actions/bot";
import { addGiveaway } from "@/actions/giveaway";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useReducer, useState } from "react";
import { motion } from "framer-motion";

// Reducer for managing form state
const initialState = {
  numWinners: 3,
  minVotes: 1,
  pRequirements: { chatMember: true, premiumUser: false, chatBooster: false },
  vRequirements: { chatMember: true, premiumUser: false, chatBooster: false },
  rewards: {},
  startDate: new Date(),
  endDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
  isStartDatePickerOpen: false,
  isEndDatePickerOpen: false,
};

function formReducer(state, action) {
  switch (action.type) {
    case "SET_NUM_WINNERS":
      return { ...state, numWinners: action.payload === "" ? "" : Math.max(1, Number(action.payload)) };
    case "SET_MIN_VOTES":
      return { ...state, minVotes: action.payload === "" ? "" : Math.max(1, Number(action.payload)) };
    case "SET_P_REQUIREMENTS":
      return { ...state, pRequirements: { ...state.pRequirements, ...action.payload } };
    case "SET_V_REQUIREMENTS":
      return { ...state, vRequirements: { ...state.vRequirements, ...action.payload } };
    case "SET_REWARDS":
      return { ...state, rewards: { ...state.rewards, ...action.payload } };
    case "SET_START_DATE":
      return { ...state, startDate: action.payload, isStartDatePickerOpen: false };
    case "SET_END_DATE":
      return { ...state, endDate: action.payload, isEndDatePickerOpen: false };
    case "TOGGLE_START_DATE_PICKER":
      return { ...state, isStartDatePickerOpen: !state.isStartDatePickerOpen };
    case "TOGGLE_END_DATE_PICKER":
      return { ...state, isEndDatePickerOpen: !state.isEndDatePickerOpen };
    default:
      return state;
  }
}

// Switch Component
function Switch({ id, text, isChecked = false, isDisabled = false, onChange }) {
  return (
    <label htmlFor={id} className={styles.switchWrap}>
      <span>{text}</span>
      <div className={styles.switch}>
        <input
          type="checkbox"
          name={id}
          id={id}
          checked={isChecked}
          disabled={isDisabled}
          onChange={onChange}
        />
        <span className={styles.slider}></span>
      </div>
    </label>
  );
}

// ChatSkeleton Wrapper Component
function ChatSkeleton({ children }) {
  return (
    <div className={styles.chat}>
      <Skeleton circle width={45} height={45} containerClassName={styles.chatImage} />
      <Skeleton containerClassName={styles.title} />
    </div>
  );
}

// DynamicInputs Component
function DynamicInputs({ winnerIndex, rewards, dispatch }) {
  const [isOpen, setIsOpen] = useReducer((state) => !state, false);

  const options = rewards[winnerIndex] || [];

  const handleChange = useCallback(
    (index, value) => {
      dispatch({
        type: "SET_REWARDS",
        payload: {
          [winnerIndex]: [
            ...(rewards[winnerIndex] || []).slice(0, index),
            value,
            ...(index === (rewards[winnerIndex] || []).length - 1 && value.trim()
              ? [""]
              : (rewards[winnerIndex] || []).slice(index + 1)),
          ],
        },
      });
    },
    [rewards, winnerIndex, dispatch]
  );

  const removeOption = useCallback(
    (index) => {
      const newOpts = (rewards[winnerIndex] || []).filter((_, i) => i !== index);

      // Don't close last input
      if (index === newOpts.length) return;

      dispatch({
        type: "SET_REWARDS",
        payload: {
          [winnerIndex]: newOpts.length > 0 ? newOpts : undefined,
        },
      });
      if (newOpts.length === 0) setIsOpen();
    },
    [rewards, winnerIndex, dispatch]
  );

  const handleToggle = useCallback(() => {
    if (!isOpen && (!rewards[winnerIndex] || rewards[winnerIndex].length === 0)) {
      dispatch({
        type: "SET_REWARDS",
        payload: { [winnerIndex]: [""] },
      });
    }
    setIsOpen();
  }, [isOpen, rewards, winnerIndex, dispatch]);

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
      {isOpen && options.length > 0 && (
        <div className={styles.dInpWrapper}>
          {options.map((opt, i) => (
            <div key={i} className={styles.rewardRow}>
              <span className={styles.rewardIndex}>{i + 1}</span>
              <div className={styles.inputWrapper}>
                <input
                  type="text"
                  value={opt}
                  placeholder={`Reward ${i + 1}`}
                  onChange={(e) => handleChange(i, e.target.value)}
                  className={styles.input}
                />
                <button className={styles.removeBtn} onClick={() => removeOption(i)}>
                  <RxCross2 />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

// Main Component
export default function CreateGiveawayPage({ chats }) {
  const [state, dispatch] = useReducer(formReducer, initialState);
  const [tg, setTg] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Clean rewards memoization
  const cleanRewards = useMemo(() => {
    return Object.fromEntries(
      Object.entries(state.rewards).reduce((acc, [key, arr]) => {
        const filtered = arr.filter((item) => item?.trim());
        if (filtered.length > 0) acc.push([key, filtered]);
        return acc;
      }, [])
    );
  }, [state.rewards]);

  // Telegram WebApp initialization
  useEffect(() => {
    if (typeof window !== "undefined" && window.Telegram?.WebApp) {
      const tgx = window.Telegram.WebApp;
      tgx.ready();
      setTg(tgx);
      setUser(tgx.initDataUnsafe?.user || null);
    }
  }, []);

  // Show alert if chats failed to load
  useEffect(() => {
    if (chats.length === 0 && tg) {
      tg.showAlert("Failed to load chats. Please try again.");
    }
  }, [chats, tg]);

  // Date validation
  useEffect(() => {
    if (state.endDate.getTime() <= state.startDate.getTime()) {
      dispatch({
        type: "SET_END_DATE",
        payload: new Date(state.startDate.getTime() + 24 * 60 * 60 * 1000),
      });
    }
  }, [state.startDate, state.endDate]);

  const handleClick = useCallback(async () => {
    if (!user?.id) {
      tg.showAlert("User not authenticated. Please try again.");
      return;
    }
    setLoading(true);
    try {
      const data = {
        chats,
        numWinners: state.numWinners,
        minVotes: state.minVotes,
        pRequirements: state.pRequirements,
        vRequirements: state.vRequirements,
        rewards: cleanRewards,
        startTime: Math.floor(state.startDate.getTime() / 1000),
        endTime: Math.floor(state.endDate.getTime() / 1000),
        user,
      };

      const result = await addGiveaway(data);
      const isMessageSent = await sendMessage(
        user.id,
        `✅ <b>Giveaway Created Successfully!</b>\n\n<b>Participation Link:</b> <i>https://t.me/${process.env.NEXT_PUBLIC_BOT_USERNAME}/giveaway?startapp=${result.id}</i>\n\nUsers can join or view the giveaway by opening the participation link.`
      );
      if (isMessageSent) {
        tg?.close();
      } else {
        router.push(`/giveaway?id=${result.id}`);
      }
    } catch (err) {
      console.error("Error saving giveaway:", err);
      tg.showAlert("Failed to create giveaway. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [
    user?.id,
    chats,
    state.numWinners,
    state.minVotes,
    state.pRequirements,
    state.vRequirements,
    cleanRewards,
    state.startDate,
    state.endDate,
    tg,
    router,
  ]);

  return (
    <main className={styles.main}>
      <motion.div 
        className={styles.head}
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Image src="/giftIcon.png" width={100} height={100} alt="Gift Icon" draggable={false} />
        <h2>Create Giveaway</h2>
        <p>Grow your chat and engage users by hosting a giveaway.</p>
      </motion.div>

      <motion.div 
        className={styles.container}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <h4 className={styles.heading}>Included Chats</h4>
        <div className={styles.chats}>
          {chats.length === 0 && (
            <Skeleton
              wrapper={ChatSkeleton}
              count={1}
              containerClassName={styles.chatSkeletonContainer}
            />
          )}
          {chats.map((chat) => (
            <div key={chat.id} className={styles.chat}>
              <Image src={chat.photo} width={45} height={45} alt="Chat" draggable={false} />
              <span className={styles.title}>{chat.title}</span>
            </div>
          ))}
        </div>
      </motion.div>
      <p className={styles.help}>Users must join these groups or channels to participate or vote.</p>

      <motion.div 
        className={styles.container}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <label htmlFor="numWinners" className={styles.heading}>Total Winners</label>
        <div className={styles.inp}>
          <input
            id="numWinners"
            type="number"
            min="1"
            value={state.numWinners}
            onChange={(e) => dispatch({ type: "SET_NUM_WINNERS", payload: e.target.value })}
            onBlur={() => {
              if (state.numWinners === "" || isNaN(state.numWinners)) {
                dispatch({ type: "SET_NUM_WINNERS", payload: "1" });
              }
            }}
            onWheel={(e) => e.target.blur()}
            placeholder="Set number of winners"
          />
        </div>
      </motion.div>
      <p className={styles.help}>Choose how many users will win this giveaway.</p>

      <motion.div 
        className={styles.container}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <label htmlFor="minVotes" className={styles.heading}>Minimum Votes</label>
        <div className={styles.inp}>
          <input
            id="minVotes"
            type="number"
            min="1"
            value={state.minVotes}
            onChange={(e) => dispatch({ type: "SET_MIN_VOTES", payload: e.target.value })}
            onBlur={() => {
              if (state.minVotes === "" || isNaN(state.minVotes)) {
                dispatch({ type: "SET_MIN_VOTES", payload: "1" });
              }
            }}
            onWheel={(e) => e.target.blur()}
            placeholder="Set minimum votes"
          />
        </div>
      </motion.div>
      <p className={styles.help}>The minimum votes needed for a participant to be eligible for winning.</p>

      <motion.div 
        className={styles.container}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <h4 className={styles.heading}>Participation Requirements</h4>
        <Switch
          id="pcmSwitch"
          text="Chat Member"
          isChecked={state.pRequirements.chatMember}
          isDisabled
          onChange={(e) =>
            dispatch({ type: "SET_P_REQUIREMENTS", payload: { chatMember: e.target.checked } })
          }
        />
        <Switch
          id="ppuSwitch"
          text="Premium User"
          isChecked={state.pRequirements.premiumUser}
          onChange={(e) =>
            dispatch({ type: "SET_P_REQUIREMENTS", payload: { premiumUser: e.target.checked } })
          }
        />
        <Switch
          id="pcbSwitch"
          text="Chat Booster"
          isChecked={state.pRequirements.chatBooster}
          onChange={(e) =>
            dispatch({ type: "SET_P_REQUIREMENTS", payload: { chatBooster: e.target.checked } })
          }
        />
      </motion.div>
      <p className={styles.help}>Choose what users must meet to join the giveaway.</p>

      <motion.div 
        className={styles.container}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <h4 className={styles.heading}>Voting Requirements</h4>
        <Switch
          id="vcmSwitch"
          text="Chat Member"
          isChecked={state.vRequirements.chatMember}
          isDisabled
          onChange={(e) =>
            dispatch({ type: "SET_V_REQUIREMENTS", payload: { chatMember: e.target.checked } })
          }
        />
        <Switch
          id="vpuSwitch"
          text="Premium User"
          isChecked={state.vRequirements.premiumUser}
          onChange={(e) =>
            dispatch({ type: "SET_V_REQUIREMENTS", payload: { premiumUser: e.target.checked } })
          }
        />
        <Switch
          id="vcbSwitch"
          text="Chat Booster"
          isChecked={state.vRequirements.chatBooster}
          onChange={(e) =>
            dispatch({ type: "SET_V_REQUIREMENTS", payload: { chatBooster: e.target.checked } })
          }
        />
      </motion.div>
      <p className={styles.help}>Define the conditions a user must meet to cast a vote.</p>

      <motion.div 
        className={styles.container}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <h4 className={styles.heading}>Rewards</h4>
        {Array.from({ length: state.numWinners }, (_, i) => (
          <DynamicInputs key={i + 1} winnerIndex={i + 1} rewards={state.rewards} dispatch={dispatch} />
        ))}
      </motion.div>
      <p className={styles.help}>List the rewards for each winning position.</p>

      <motion.div 
        className={styles.container}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <h4 className={styles.heading}>Date When Giveaway Starts</h4>
        <div className={styles.dateBox} onClick={() => dispatch({ type: "TOGGLE_START_DATE_PICKER" })}>
          <span>Date and Time</span>
          <span className={styles.date}>
            {state.startDate.toLocaleString("en-US", { month: "short", day: "numeric" })} at{" "}
            {state.startDate.getHours().toString().padStart(2, "0")}:
            {state.startDate.getMinutes().toString().padStart(2, "0")}
          </span>
        </div>
        {state.isStartDatePickerOpen && (
          <DateTimePicker
            onConfirm={(date) => dispatch({ type: "SET_START_DATE", payload: date })}
            defaultDateTime={state.startDate}
            closeHandler={() => dispatch({ type: "TOGGLE_START_DATE_PICKER" })}
          />
        )}
      </motion.div>
      <p className={styles.help}>Select the start date and time for your giveaway.</p>

      <motion.div 
        className={styles.container}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <h4 className={styles.heading}>Date When Giveaway Ends</h4>
        <div className={styles.dateBox} onClick={() => dispatch({ type: "TOGGLE_END_DATE_PICKER" })}>
          <span>Date and Time</span>
          <span className={styles.date}>
            {state.endDate.toLocaleString("en-US", { month: "short", day: "numeric" })} at{" "}
            {state.endDate.getHours().toString().padStart(2, "0")}:
            {state.endDate.getMinutes().toString().padStart(2, "0")}
          </span>
        </div>
        {state.isEndDatePickerOpen && (
          <DateTimePicker
            onConfirm={(date) => dispatch({ type: "SET_END_DATE", payload: date })}
            defaultDateTime={state.endDate}
            closeHandler={() => dispatch({ type: "TOGGLE_END_DATE_PICKER" })}
          />
        )}
      </motion.div>
      <p className={styles.help}>Select the end date and time for your giveaway.</p>

      <motion.div 
        className={`${styles.container} ${styles.btn}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
      >
        <button className={styles.button} onClick={handleClick} disabled={loading}>
          {loading ? <div className={styles.spinner}></div> : "Start Giveaway"}
        </button>
      </motion.div>
    </main>
  );
}
