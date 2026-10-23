import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaClock, FaFire, FaLock } from 'react-icons/fa';
import './DeadlineMeter.css';

export default function DeadlineMeter({ endDate, startDate }) {
  const [timeLeft, setTimeLeft] = useState({
    totalMs: 0,
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false,
    progressPercent: 0
  });

  useEffect(() => {
    const calculateTime = () => {
      const now = new Date().getTime();
      const end = new Date(endDate).getTime();
      const start = startDate ? new Date(startDate).getTime() : end - (48 * 60 * 60 * 1000);

      const diff = end - now;

      if (diff <= 0) {
        setTimeLeft({
          totalMs: 0,
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          isExpired: true,
          progressPercent: 100
        });
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      const totalDuration = Math.max(1, end - start);
      const elapsed = Math.max(0, now - start);
      const progressPercent = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));

      setTimeLeft({
        totalMs: diff,
        days,
        hours,
        minutes,
        seconds,
        isExpired: false,
        progressPercent
      });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);

    return () => clearInterval(interval);
  }, [endDate, startDate]);

  const { days, hours, minutes, seconds, isExpired, progressPercent, totalMs } = timeLeft;
  const isUrgent = !isExpired && totalMs < 3 * 60 * 60 * 1000;
  const remainingPercent = Math.round(100 - progressPercent);

  return (
    <div className={`deadline-pill-container ${isExpired ? 'expired' : isUrgent ? 'urgent' : ''}`}>
      {/* Segment 1: Status Badge */}
      <div className="pill-segment segment-status">
        {isExpired ? (
          <span className="status-badge expired-tag"><FaLock size={12} /> CLOSED</span>
        ) : isUrgent ? (
          <span className="status-badge urgent-tag"><FaFire className="flame-pulse" size={12} /> URGENT</span>
        ) : (
          <span className="status-badge active-tag"><FaClock size={12} /> DEADLINE</span>
        )}
      </div>

      <div className="pill-divider" />

      {/* Segment 2: Live Countdown Ticker */}
      <div className="pill-segment segment-timer">
        {!isExpired ? (
          <div className="pill-countdown">
            {days > 0 && <span className="time-part"><strong className="num">{String(days).padStart(2, '0')}</strong><small>d</small></span>}
            <span className="time-part"><strong className="num">{String(hours).padStart(2, '0')}</strong><small>h</small></span>
            <span className="colon">:</span>
            <span className="time-part"><strong className="num">{String(minutes).padStart(2, '0')}</strong><small>m</small></span>
            <span className="colon">:</span>
            <span className="time-part"><strong className="num">{String(seconds).padStart(2, '0')}</strong><small>s</small></span>
          </div>
        ) : (
          <span className="expired-text">Ended</span>
        )}
      </div>

      <div className="pill-divider" />

      {/* Segment 3: Meter Progress Percentage */}
      <div className="pill-segment segment-meter">
        <div className="meter-ring-group">
          <span className="meter-percent-val">{isExpired ? '0%' : `${remainingPercent}%`}</span>
          <span className="meter-percent-sub">{isExpired ? 'Closed' : 'Left'}</span>
        </div>
      </div>

      {/* Bottom Progress Bar Meter */}
      <div className="pill-progress-track">
        <motion.div 
          className={`pill-progress-fill ${isExpired ? 'fill-expired' : isUrgent ? 'fill-urgent' : ''}`}
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}
