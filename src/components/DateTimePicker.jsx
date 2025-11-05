"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import styles from "@/styles/DateTimePicker.module.css";

export default function DateTimePicker({ onConfirm, defaultDateTime, closeHandler }) {
  const ITEM_HEIGHT = 36;
  const PADDING_TOP = 72; // Match CSS padding-top

  const [mounted, setMounted] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false); // Track confirm action

  const dateRef = useRef();
  const hourRef = useRef();
  const minuteRef = useRef();
  const scrolling = useRef({ date: false, hour: false, minute: false });
  const scrollIndices = useRef({ date: 0, hour: 0, minute: 0 }); // Track scroll indices

  const [selected, setSelected] = useState({
    dateObj: null,
    hour: "00",
    minute: "00",
  });

  useEffect(() => {
    setMounted(true);
    const defaultDate = defaultDateTime instanceof Date && !isNaN(defaultDateTime) 
      ? defaultDateTime 
      : new Date();
    const initialState = {
      dateObj: new Date(defaultDate.getFullYear(), defaultDate.getMonth(), defaultDate.getDate()),
      hour: String(defaultDate.getHours()).padStart(2, "0"),
      minute: String(defaultDate.getMinutes()).padStart(2, "0"),
    };
    setSelected(initialState);
    scrollIndices.current = {
      date: 0, // Today
      hour: parseInt(initialState.hour),
      minute: parseInt(initialState.minute),
    };
  }, [defaultDateTime]);

  const dates = useMemo(() => {
    if (!mounted) return [];
    const today = new Date();
    return Array.from({ length: 32 }, (_, i) => {
      const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() + i);
      return {
        label: i === 0 ? "Today" : d.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
        date: d,
      };
    });
  }, [mounted]);

  const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));

  const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));

  useEffect(() => {
    if (!mounted) return;
    let newHour = selected.hour;
    let newMinute = selected.minute;
    let newHourIndex = hours.indexOf(newHour);
    let newMinuteIndex = minutes.indexOf(newMinute);

    // If selected hour/minute is invalid, reset to earliest available
    if (hours.length && !hours.includes(newHour)) {
      newHour = hours[0];
      newHourIndex = 0;
    }
    if (minutes.length && !minutes.includes(newMinute)) {
      newMinute = minutes[0];
      newMinuteIndex = 0;
    }

    // Update selected state if changed
    if (newHour !== selected.hour || newMinute !== selected.minute) {
      setSelected((s) => ({ ...s, hour: newHour, minute: newMinute }));
    }

    // Update scroll indices and positions
    if (newHourIndex !== scrollIndices.current.hour || newMinuteIndex !== scrollIndices.current.minute) {
      scrollIndices.current.hour = newHourIndex >= 0 ? newHourIndex : 0;
      scrollIndices.current.minute = newMinuteIndex >= 0 ? newMinuteIndex : 0;
      smoothScrollTo(hourRef, hours, "hour", scrollIndices.current.hour);
      smoothScrollTo(minuteRef, minutes, "minute", scrollIndices.current.minute);
    }
  }, [hours, minutes, mounted]);

  const attachScrollHandler = (ref, key, list) => {
    if (!ref.current || !mounted) return;
    const el = ref.current;
    const centerOffset = el.clientHeight / 2 - ITEM_HEIGHT / 2;
    let timeout;

    const onScroll = () => {
      if (scrolling.current[key] || isConfirming) return;
      scrolling.current[key] = true;
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        const index = Math.round((el.scrollTop + centerOffset - PADDING_TOP) / ITEM_HEIGHT);
        if (index >= 0 && index < list.length) {
          scrollIndices.current[key] = index;
        }
        scrolling.current[key] = false;
      }, 100);
    };

    el.addEventListener("scroll", onScroll);
    return () => {
      el.removeEventListener("scroll", onScroll);
      clearTimeout(timeout);
    };
  };

  useEffect(() => {
    if (!mounted) return;
    const cleanups = [
      attachScrollHandler(dateRef, "date", dates),
      attachScrollHandler(hourRef, "hour", hours),
      attachScrollHandler(minuteRef, "minute", minutes),
    ];
    return () => cleanups.forEach((fn) => fn && fn());
  }, [dates, hours, minutes, mounted, isConfirming]);

  const snapToNearest = (ref, list, key) => {
    if (!ref.current || !mounted) return;
    const el = ref.current;
    const centerOffset = el.clientHeight / 2 - ITEM_HEIGHT / 2;
    const index = Math.round((el.scrollTop + centerOffset - PADDING_TOP) / ITEM_HEIGHT);
    if (index >= 0 && index < list.length) {
      const targetScroll = index * ITEM_HEIGHT;
      if (Math.abs(el.scrollTop - targetScroll) > 0.1) {
        scrolling.current[key] = true;
        el.scrollTo({ top: targetScroll, behavior: "instant" });
        scrolling.current[key] = false;
      }
      scrollIndices.current[key] = index;
    }
  };

  const smoothScrollTo = (ref, list, key, index) => {
    if (!ref.current || !mounted) return;
    if (index < 0 || index >= list.length) return;
    const el = ref.current;
    const targetScroll = index * ITEM_HEIGHT;
    const currentScroll = el.scrollTop;
    if (Math.abs(currentScroll - targetScroll) > 0.1 && !scrolling.current[key]) {
      scrolling.current[key] = true;
      el.scrollTo({ top: targetScroll, behavior: "smooth" });
      setTimeout(() => {
        scrolling.current[key] = false;
      }, 1000);
    }
  };

  // Initialize scroll positions on mount
  useEffect(() => {
    if (!mounted) return;
    smoothScrollTo(dateRef, dates, "date", scrollIndices.current.date);
    smoothScrollTo(hourRef, hours, "hour", scrollIndices.current.hour);
    smoothScrollTo(minuteRef, minutes, "minute", scrollIndices.current.minute);
  }, [dates, hours, minutes, mounted]);

  const handleConfirm = () => {
    if (!mounted || isConfirming) return;
    setIsConfirming(true);

    // Force snap alignment for all columns
    snapToNearest(dateRef, dates, "date");
    snapToNearest(hourRef, hours, "hour");
    snapToNearest(minuteRef, minutes, "minute");

    // Process selection immediately after snapping (instant scroll)
    const dateValue = dates[scrollIndices.current.date]?.date;
    const hourValue = hours[scrollIndices.current.hour];
    const minuteValue = minutes[scrollIndices.current.minute];

    if (!dateValue || !hourValue || !minuteValue) {
      setIsConfirming(false);
      return;
    }

    const newSelected = {
      dateObj: new Date(dateValue),
      hour: hourValue,
      minute: minuteValue,
    };

    setSelected(newSelected);
    const dateObj = new Date(newSelected.dateObj);
    dateObj.setHours(parseInt(newSelected.hour), parseInt(newSelected.minute), 0, 0);
    onConfirm?.(dateObj);
    setIsConfirming(false);
  };

  if (!mounted) return null;

  return (
    <div className={styles.overlay} onClick={() => closeHandler(false)}>
      <div className={styles.panel} onClick={e => e.stopPropagation()}>
        <div className={styles.title}>Select Date and Time</div>
        <div className={`${styles.scrollArea} ${isConfirming ? styles["no-interaction"] : ""}`}>
          <div className={styles.selectorLine}></div>

          <div className={`${styles.scrollColumn} ${isConfirming ? styles["no-scroll"] : ""} ${isConfirming ? styles["no-snap"] : ""}`} ref={dateRef}>
            {dates.map(({ label }) => (
              <div key={label} className={styles.option}>
                {label}
              </div>
            ))}
          </div>

          <div className={`${styles.scrollColumn} ${isConfirming ? styles["no-scroll"] : ""} ${isConfirming ? styles["no-snap"] : ""}`} ref={hourRef}>
            {hours.map((h) => (
              <div key={h} className={styles.option}>
                {h}
              </div>
            ))}
          </div>

          <div className={`${styles.scrollColumn} ${isConfirming ? styles["no-scroll"] : ""} ${isConfirming ? styles["no-snap"] : ""}`} ref={minuteRef}>
            {minutes.map((m) => (
              <div key={m} className={styles.option}>
                {m}
              </div>
            ))}
          </div>

          <div className={styles.selectorLine}></div>
        </div>

        <button className={styles.confirm} onClick={handleConfirm}>
          Confirm
        </button>
      </div>
    </div>
  );
}
