'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from '@/styles/BottomSheetModal.module.css';
import { IoCheckmarkCircleSharp } from 'react-icons/io5';
import { MdOutlineRadioButtonUnchecked, MdCancel } from 'react-icons/md';


export default function BottomSheetModal({ title, options, isOpen, setIsOpen, isCheckClickable, handleClick }) {
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [startHeight, setStartHeight] = useState(0);
  const [maxContentHeight, setMaxContentHeight] = useState(75); // Cap at 75vh
  const [dragDistance, setDragDistance] = useState(0); // Track drag distance
  const bottomSheetRef = useRef(null);
  const sheetContentRef = useRef(null);
  const dragHandleRef = useRef(null);
  const bsmBodyRef = useRef(null);
  const [loading, setLoading] = useState(false);

  const MIN_DRAG_THRESHOLD = 5; // Minimum pixels to consider a drag

  const updateSheetHeight = (height) => {
    if (sheetContentRef.current) {
      const cappedHeight = Math.min(height, maxContentHeight);
      sheetContentRef.current.style.height = `${cappedHeight}vh`;
    }
  };

  const hideBottomSheet = (e) => {
    e.stopPropagation(); // Prevent event from bubbling to drag handlers
    setIsOpen(false);
  };

  const dragStart = (e) => {
    if (e.type === 'touchstart') {
      e.preventDefault(); // Prevent page scrolling on touch
    }
    setIsDragging(true);
    setStartY(e.pageY || e.touches?.[0].pageY);
    setStartHeight(parseInt(sheetContentRef.current.style.height || maxContentHeight));
    setDragDistance(0); // Reset drag distance
    bottomSheetRef.current.classList.add(styles.dragging);
  };

  const dragging = (e) => {
    if (!isDragging) return;
    const currentY = e.pageY || e.touches?.[0].pageY;
    const delta = startY - currentY;
    setDragDistance(Math.abs(delta));
    const newHeight = startHeight + (delta / window.innerHeight) * 100;
    if (newHeight <= maxContentHeight) {
      updateSheetHeight(newHeight);
    }
  };

  const dragStop = () => {
    if (!isDragging) return; // Skip if not dragging
    setIsDragging(false);
    bottomSheetRef.current.classList.remove(styles.dragging);
    if (!isOpen) return; // Skip if sheet is closing
    const sheetHeight = parseInt(sheetContentRef.current.style.height || maxContentHeight);
    if (dragDistance > MIN_DRAG_THRESHOLD) {
      if (sheetHeight < 25) {
        hideBottomSheet(new Event('click')); // Pass a dummy event
      } else {
        updateSheetHeight(maxContentHeight);
      }
    }
  };

  useEffect(() => {
    if (isOpen && bsmBodyRef.current) {
      const contentHeightPx =
        bsmBodyRef.current.scrollHeight +
        sheetContentRef.current.querySelector(`.${styles.header}`).offsetHeight +
        25; // Include header and padding
      const viewportHeightPx = window.innerHeight;
      const contentHeightVh = (contentHeightPx / viewportHeightPx) * 100;
      const adjustedContentHeightVh = Math.min(contentHeightVh, 75); // Cap at 75vh
      setMaxContentHeight(adjustedContentHeightVh);
      updateSheetHeight(adjustedContentHeightVh);
    }
  }, [isOpen]);

  useEffect(() => {
    const dragHandle = dragHandleRef.current;
    const sheetOverlay = bottomSheetRef.current?.querySelector(`.${styles.sheetOverlay}`);

    dragHandle.addEventListener('mousedown', dragStart);
    document.addEventListener('mousemove', dragging);
    document.addEventListener('mouseup', dragStop);
    dragHandle.addEventListener('touchstart', dragStart);
    document.addEventListener('touchmove', dragging);
    document.addEventListener('touchend', dragStop);
    sheetOverlay.addEventListener('click', hideBottomSheet);

    return () => {
      dragHandle.removeEventListener('mousedown', dragStart);
      document.removeEventListener('mousemove', dragging);
      document.removeEventListener('mouseup', dragStop);
      dragHandle.removeEventListener('touchstart', dragStart);
      document.removeEventListener('touchmove', dragging);
      document.removeEventListener('touchend', dragStop);
      sheetOverlay.removeEventListener('click', hideBottomSheet);
    };
  }, [isDragging, startY, startHeight, dragDistance, isOpen]);

  return (
    <div className={`${styles.bottomSheet} ${isOpen ? styles.show : ''}`} ref={bottomSheetRef}>
      <div className={styles.sheetOverlay}></div>

      <div className={styles.content} ref={sheetContentRef}>
        <div className={styles.header} ref={dragHandleRef}>
          <div className={styles.dragIcon}>
            <span></span>
          </div>
          <h4>{title}</h4>
        </div>

        <div className={styles.bsmBody} ref={bsmBodyRef}>
          <div className={styles.options}>
            {options.map((option, key) => (
              <Link key={key} href={option.link} target="_blank" className={styles.optionLink}>
                <div className={styles.optionContent}>
                  <Image src={option.photo} height={45} width={45} alt={option.title} draggable={false} />
                  <span>{option.title}</span>
                  {option.subtitle && <span className={styles.subtitle}>{option.subtitle}</span>}
                </div>
                {
                  (option.status === "success") ? (
                    <IoCheckmarkCircleSharp style={{ color: '#04db2fff', fontSize: '1.2rem' }} />
                  ) : (option.status === "failed") ? (
                    <MdCancel style={{ color: '#ff3434ff', fontSize: '1.2rem' }} />
                  ) : (
                    <MdOutlineRadioButtonUnchecked style={{ color: '#989898', fontSize: '1.2rem' }} />
                  )
                }
              </Link>
            ))}
          </div>
          <div className={styles.btn}>
            <button className={styles.checkButton} disabled={loading || !isCheckClickable} onClick={() => {handleClick(setLoading)}}>{loading ? <div className={styles.spinner}></div> : 'Check'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}