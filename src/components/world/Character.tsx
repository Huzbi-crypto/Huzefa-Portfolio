'use client';

import React, { useState, useEffect, useRef } from 'react';
import { AvatarActionState, HotspotCoordinates } from '@/types/avatar';

export interface CharacterProps {
  actionState?: AvatarActionState;
  hotspot?: HotspotCoordinates;
  cursorPos?: { x: number; y: number };
  gazeOverride?: { x: number; y: number } | null;
  bubbleText?: string | null;
  facingRight?: boolean;
  onAvatarClick?: () => void;
  className?: string;
  isLampOn?: boolean;
}

export const DIALOGUES = [
  "hey... it's 2:14 AM and this code is finally running.",
  "just one more One Piece chapter, then I'll sleep (lies).",
  "bleach bankai scenes never get old.",
  "naruto's resolve honestly fuels my late-night debugging.",
  "asta's anti-magic grind: never give up, even with zero magic.",
  "saitama's serious punch would probably break my compiler.",
  "dijkstra's shortest path never disappoints.",
  "tea is still warm. good sign.",
  "38 repos on GitHub and still dreaming up more.",
  "nothing beats late night coding with good music.",
  "welcome to my room. make yourself at home.",
];

export const Character: React.FC<CharacterProps> = ({
  actionState = 'idle',
  hotspot,
  cursorPos = { x: 0, y: 0 },
  gazeOverride = null,
  bubbleText = null,
  facingRight = true,
  onAvatarClick,
  className = '',
  isLampOn = true,
}) => {
  const [blinking, setBlinking] = useState<boolean>(false);
  const [dialogueIndex, setDialogueIndex] = useState<number>(0);
  const [showSpeechBubble, setShowSpeechBubble] = useState<boolean>(false);
  const [overrideBubble, setOverrideBubble] = useState<string | null>(null);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [typingTick, setTypingTick] = useState<number>(0);
  const bubbleTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Blinking loop (every 3.2 to 5.6 seconds)
  useEffect(() => {
    let blinkTimer: NodeJS.Timeout;
    const triggerBlink = () => {
      setBlinking(true);
      setTimeout(() => setBlinking(false), 140);
      const nextDelay = 3200 + Math.random() * 2400;
      blinkTimer = setTimeout(triggerBlink, nextDelay);
    };
    blinkTimer = setTimeout(triggerBlink, 2800);
    return () => clearTimeout(blinkTimer);
  }, []);

  // Typing tick animation for rapid keypresses
  useEffect(() => {
    if (actionState !== 'typing') return;
    const interval = setInterval(() => {
      setTypingTick((prev) => (prev + 1) % 4);
    }, 140);
    return () => clearInterval(interval);
  }, [actionState]);

  // When bubbleText updates from external events (clicking monitor, laptop, cat, window, etc.)
  useEffect(() => {
    if (bubbleText) {
      setOverrideBubble(bubbleText);
      setShowSpeechBubble(true);
      if (bubbleTimerRef.current) clearTimeout(bubbleTimerRef.current);
      bubbleTimerRef.current = setTimeout(() => {
        setShowSpeechBubble(false);
        setOverrideBubble(null);
      }, 4800);
    } else {
      setOverrideBubble(null);
    }
  }, [bubbleText]);

  const handleCharacterClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Dismiss any temporary device override and advance dialogue
    setOverrideBubble(null);
    if (onAvatarClick) {
      onAvatarClick();
    }

    const nextIndex = (dialogueIndex + 1) % DIALOGUES.length;
    setDialogueIndex(nextIndex);
    setShowSpeechBubble(true);

    if (bubbleTimerRef.current) clearTimeout(bubbleTimerRef.current);
    bubbleTimerRef.current = setTimeout(() => {
      setShowSpeechBubble(false);
    }, 4500);
  };

  // Pupil calculation: gazeOverride takes precedence over mouse cursor coordinates
  const effectiveX = gazeOverride ? gazeOverride.x : cursorPos.x;
  const effectiveY = gazeOverride ? gazeOverride.y : cursorPos.y;
  const eyeOffsetX = Math.max(-1.5, Math.min(1.5, effectiveX * 1.5));
  const eyeOffsetY = Math.max(-1, Math.min(1, effectiveY * 1));

  // Dynamic bubble positioning based on hotspot anchor
  const bubbleAnchor = hotspot?.bubbleAnchor ?? 'top-center';
  const getBubbleAlignmentClasses = () => {
    switch (bubbleAnchor) {
      case 'top-left':
        return 'left-0 sm:-left-6 translate-x-0';
      case 'top-right':
        return 'right-0 sm:-right-6 translate-x-0';
      case 'top-center':
      default:
        return 'left-1/2 -translate-x-1/2';
    }
  };

  const getArrowClasses = () => {
    switch (bubbleAnchor) {
      case 'top-left':
        return 'left-8';
      case 'top-right':
        return 'right-8';
      case 'top-center':
      default:
        return 'left-1/2 -translate-x-1/2';
    }
  };

  const activeDialogueContent = overrideBubble || DIALOGUES[dialogueIndex];

  return (
    <div
      className={`relative w-full h-full select-none cursor-pointer ${className}`}
      onClick={handleCharacterClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="img"
      aria-label="Pixel art representation of Huzbi"
    >
      {/* 1. ADAPTIVE SPEECH BUBBLE (Mounted OUTSIDE the flipped sprite container so text is NEVER mirrored) */}
      {(showSpeechBubble || isHovered) && (
        <div
          className={`absolute z-50 pointer-events-none transition-all duration-200 ${getBubbleAlignmentClasses()}`}
          style={{
            width: 'max-content',
            maxWidth: '320px',
            bottom: actionState === 'petting' ? '70%' : '100%',
            marginBottom: actionState === 'petting' ? '4px' : '12px',
          }}
        >
          <div
            className="relative border-2 border-accent text-fg font-mono text-[11px] sm:text-xs px-3 py-1.5 rounded-xl shadow-2xl leading-relaxed bg-bg-deep"
            style={{
              borderColor: 'var(--color-accent)',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.95), 0 0 12px var(--color-glow)',
            }}
          >
            <span className="text-accent font-bold mr-1.5">&gt;</span>
            {activeDialogueContent}
            {/* Triangular Tail */}
            <div
              className={`absolute -bottom-1.5 w-2.5 h-2.5 border-r-2 border-b-2 rotate-45 bg-bg-deep ${getArrowClasses()}`}
              style={{ borderColor: 'var(--color-accent)' }}
            />
          </div>
        </div>
      )}

      {/* 2. INNER SPRITE CONTAINER (Flipped horizontally with scaleX based on walking direction) */}
      <div
        className={`w-full h-full transition-transform duration-200 ${
          actionState === 'walking' ? 'avatar-walk-bob' : ''
        }`}
        style={{
          transform: facingRight ? 'scaleX(1)' : 'scaleX(-1)',
          transformOrigin: '50% 85%',
        }}
      >
        <svg
          viewBox="0 0 80 95"
          className="w-full h-full pixelated drop-shadow-md overflow-visible"
          shapeRendering="crispEdges"
        >
          <defs>
            <filter id="ledGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="0" stdDeviation="1" floodColor="var(--color-accent)" floodOpacity="0.8" />
            </filter>
          </defs>

          {/* --- B. HUZBI LEGS / CROUCH / WALK / SEATED --- */}
          {actionState === 'petting' ? (
            // CROUCHING POSE on rug next to armchair
            <g id="legs-crouch">
              {/* Left leg folded under */}
              <rect x="20" y="66" width="18" height="11" fill="#1A202A" rx="2" />
              <rect x="18" y="74" width="15" height="7" fill="#171C26" />
              <rect x="16" y="79" width="14" height="6" fill="#E8E6DD" />
              {/* Right forward bent knee */}
              <rect x="42" y="62" width="16" height="16" fill="#171C26" rx="2" />
              <rect x="44" y="76" width="13" height="5" fill="#E8E6DD" />
              <rect x="44" y="79" width="13" height="3" fill="#A8D672" />
            </g>
          ) : actionState === 'watching' || (actionState === 'idle' && hotspot?.id === 'desk-monitor') ? (
            // SEATED AT STOOL (legs bent forward, feet dangling towards footring)
            <g id="legs-seated">
              <rect x="29" y="66" width="10" height="15" fill="#1A202A" rx="1" />
              <rect x="41" y="66" width="10" height="15" fill="#171C26" rx="1" />
              {/* Shoes resting on stool footring */}
              <rect x="27" y="79" width="12" height="5" fill="#E8E6DD" />
              <rect x="27" y="82" width="13" height="3" fill="#A8D672" />
              <rect x="41" y="79" width="12" height="5" fill="#E8E6DD" />
              <rect x="40" y="82" width="13" height="3" fill="#A8D672" />
            </g>
          ) : actionState === 'walking' ? (
            // WALKING STRIDE
            <g id="legs-walking">
              <rect className="avatar-leg-left" x="30" y="71" width="9" height="13" fill="#1A202A" />
              <rect className="avatar-leg-left" x="28" y="82" width="11" height="4" fill="#E8E6DD" />
              <rect className="avatar-leg-right" x="41" y="71" width="9" height="13" fill="#171C26" />
              <rect className="avatar-leg-right" x="43" y="82" width="11" height="4" fill="#E8E6DD" />
            </g>
          ) : (
            // UPRIGHT / STANDING JEANS
            <g id="legs-upright">
              <rect x="30" y="71" width="9" height="13" fill="#1A202A" />
              <rect x="41" y="71" width="9" height="13" fill="#171C26" />
              <rect x="28" y="82" width="11" height="4" fill="#E8E6DD" />
              <rect x="28" y="84" width="12" height="2" fill="#A8D672" />
              <rect x="41" y="82" width="11" height="4" fill="#E8E6DD" />
              <rect x="40" y="84" width="12" height="2" fill="#A8D672" />
            </g>
          )}

          {/* --- C. TORSO & HOODIE --- */}
          <g
            id="huzbi-torso"
            className={actionState === 'idle' ? 'avatar-breathing' : ''}
            style={{
              transform: actionState === 'petting' ? 'translateY(8px)' : 'none',
            }}
          >
            {/* Dark Cozy Hoodie */}
            <rect x="27" y="45" width="26" height="26" fill="#222834" rx="1.5" />
            <rect x="29" y="47" width="22" height="22" fill="#2C3443" />
            {/* Kangaroo Pocket */}
            <rect x="31" y="58" width="18" height="9" fill="#1E232E" />
            <rect x="33" y="60" width="14" height="5" fill="#252C39" />
            {/* Drawstrings */}
            <rect x="36" y="48" width="1" height="6" fill="#A8D672" opacity="0.85" />
            <rect x="43" y="48" width="1" height="7" fill="#A8D672" opacity="0.85" />
          </g>

          {/* --- D. HEAD, FACE & HEADPHONES --- */}
          <g
            id="huzbi-head"
            style={{
              transformOrigin: '40px 38px',
              transform:
                actionState === 'petting'
                  ? 'translateY(8px) rotate(6deg)'
                  : actionState === 'watching'
                  ? 'rotate(-6deg)'
                  : actionState === 'gazing'
                  ? 'rotate(-6deg)'
                  : 'none',
              transition: 'transform 200ms ease-out',
            }}
          >
            {/* Neck */}
            <rect x="37" y="41" width="6" height="5" fill="#DEB887" />
            {/* Face */}
            <rect x="31" y="24" width="18" height="18" fill="#F3D5B5" />
            <rect x="34" y="40" width="12" height="2" fill="#DEB887" />
            <rect x="32" y="38" width="16" height="2" fill="#E5C39E" />
            {/* Cheek Blush */}
            <rect x="32" y="34" width="3" height="1" fill="#E69575" opacity="0.6" />
            <rect x="45" y="34" width="3" height="1" fill="#E69575" opacity="0.6" />
            {/* Nose */}
            <rect x="39" y="33" width="2" height="2" fill="#D9A979" />

            {/* Contextual Mouth */}
            {actionState === 'reading' ? (
              <rect x="38" y="37" width="4" height="2" fill="#5A3D28" />
            ) : actionState === 'typing' || actionState === 'petting' ? (
              <g>
                <rect x="38" y="37" width="4" height="1" fill="#5A3D28" />
                <rect x="42" y="36" width="1" height="1" fill="#5A3D28" />
              </g>
            ) : (
              <rect x="38" y="37" width="4" height="1" fill="#6E4A35" />
            )}

            {/* Contextual Eyes */}
            {blinking || actionState === 'petting' ? (
              // Happy / Affectionate closed curved eyes
              <g id="eyes-closed">
                <path d="M33,31 Q35,28 37,31" stroke="#2E1C12" strokeWidth="1.4" fill="none" />
                <path d="M43,31 Q45,28 47,31" stroke="#2E1C12" strokeWidth="1.4" fill="none" />
              </g>
            ) : (
              // Open tracking eyes
              <g id="eyes-open">
                <rect x="33" y="28" width="4" height="1" fill="#1C1512" />
                <rect x="43" y="28" width="4" height="1" fill="#1C1512" />
                <rect x="33" y="30" width="4" height="3" fill="#FFFFFF" />
                <rect x="43" y="30" width="4" height="3" fill="#FFFFFF" />
                <rect
                  x={34 + (actionState === 'watching' ? 0.8 : eyeOffsetX)}
                  y={30.5 + (actionState === 'watching' ? -0.8 : eyeOffsetY)}
                  width="2"
                  height="2"
                  fill="#1C1512"
                />
                <rect
                  x={44 + (actionState === 'watching' ? 0.8 : eyeOffsetX)}
                  y={30.5 + (actionState === 'watching' ? -0.8 : eyeOffsetY)}
                  width="2"
                  height="2"
                  fill="#1C1512"
                />
              </g>
            )}

            {/* Messy Anime Dark Hair */}
            <g id="hair">
              <rect x="30" y="19" width="20" height="7" fill="#181415" />
              <rect x="29" y="21" width="22" height="4" fill="#251F21" />
              <rect x="30" y="24" width="4" height="4" fill="#181415" />
              <rect x="33" y="24" width="3" height="3" fill="#2C2426" />
              <rect x="36" y="24" width="3" height="2" fill="#181415" />
              <rect x="40" y="24" width="4" height="3" fill="#251F21" />
              <rect x="44" y="24" width="5" height="4" fill="#181415" />
              <rect x="32" y="17" width="3" height="3" fill="#181415" />
              <rect x="37" y="16" width="4" height="4" fill="#2C2426" />
              <rect x="43" y="17" width="4" height="3" fill="#181415" />
            </g>

            {/* Retro Over-Ear Headphones */}
            <g id="headphones">
              <rect x="28" y="18" width="2" height="7" fill="#3A404D" />
              <rect x="30" y="16" width="20" height="2" fill="#2A303D" />
              <rect x="50" y="18" width="2" height="7" fill="#3A404D" />
              <rect x="27" y="25" width="4" height="10" fill="#1B202A" rx="1" />
              <rect
                x="28"
                y="29"
                width="2"
                height="2"
                fill={isLampOn ? 'var(--color-accent)' : '#445533'}
                filter="url(#ledGlow)"
              />
              <rect x="49" y="25" width="4" height="10" fill="#1B202A" rx="1" />
              <rect
                x="50"
                y="29"
                width="2"
                height="2"
                fill={isLampOn ? 'var(--color-accent)' : '#445533'}
                filter="url(#ledGlow)"
              />
            </g>
          </g>

          {/* --- E. ARMS & PROPS ACCORDING TO ACTION STATE --- */}
          {actionState === 'typing' ? (
            // TYPING RAPIDLY AT LAPTOP
            <g id="arms-typing">
              <rect x="20" y="48" width="8" height="12" fill="#222834" />
              <rect x="24" y="56" width="8" height="6" fill="#2C3443" />
              <rect
                x="30"
                y={58 + (typingTick % 2 === 0 ? 2 : 0)}
                width="6"
                height="4"
                fill="#F3D5B5"
              />
              <rect x="52" y="48" width="8" height="12" fill="#222834" />
              <rect x="48" y="56" width="8" height="6" fill="#2C3443" />
              <rect
                x="44"
                y={58 + (typingTick % 2 === 1 ? 2 : 0)}
                width="6"
                height="4"
                fill="#F3D5B5"
              />
            </g>
          ) : actionState === 'reading' ? (
            // HOLDING OPEN MANGA BOOK
            <g id="arms-reading">
              <rect x="22" y="48" width="8" height="12" fill="#222834" />
              <rect x="26" y="54" width="7" height="8" fill="#2C3443" />
              <rect x="50" y="48" width="8" height="12" fill="#222834" />
              <rect x="47" y="54" width="7" height="8" fill="#2C3443" />
              <rect x="31" y="52" width="18" height="15" fill="#992222" />
              <rect x="33" y="53" width="14" height="13" fill="#FDFBF7" />
              <rect x="39" y="53" width="2" height="13" fill="#D3CEBF" />
              <rect x="34" y="55" width="4" height="3" fill="#1C1C1C" />
              <rect x="42" y="55" width="4" height="5" fill="#1C1C1C" />
              <rect x="30" y="60" width="3" height="4" fill="#F3D5B5" />
              <rect x="47" y="60" width="3" height="4" fill="#F3D5B5" />
            </g>
          ) : actionState === 'petting' ? (
            // GENTLE PETTING MOTION - ARM REACHES FORWARD AND DOWN ONTO FLOOR CAT COUCH
            <g id="arms-petting" transform="translate(0, 8)">
              {/* Left hand braced on knee */}
              <rect x="18" y="48" width="8" height="14" fill="#222834" />
              <rect x="18" y="60" width="6" height="5" fill="#F3D5B5" />
              {/* Right arm extending forward and angling down directly onto cat */}
              <g className="avatar-petting-arm">
                <rect x="48" y="48" width="9" height="11" fill="#222834" />
                <rect x="54" y="53" width="20" height="7" fill="#2C3443" rx="1" />
                {/* Hand directly resting on and stroking cat */}
                <rect x="72" y="57" width="14" height="6" fill="#F3D5B5" rx="2" />
              </g>
            </g>
          ) : actionState === 'gazing' ? (
            // HAND IN POCKET & CHILL AT WINDOW
            <g id="arms-gazing">
              <rect x="20" y="48" width="8" height="14" fill="#222834" />
              <rect x="21" y="58" width="7" height="6" fill="#2C3443" />
              <rect x="24" y="62" width="4" height="3" fill="#F3D5B5" />
              <rect x="52" y="48" width="8" height="12" fill="#222834" />
              <rect x="46" y="58" width="8" height="5" fill="#2C3443" />
            </g>
          ) : (
            // IDLE / WATCHING RELAXED ARMS
            <g id="arms-idle">
              <rect x="20" y="48" width="8" height="14" fill="#222834" />
              <rect x="21" y="58" width="7" height="6" fill="#2C3443" />
              <rect x="22" y="62" width="5" height="4" fill="#F3D5B5" />
              <rect x="52" y="48" width="8" height="14" fill="#222834" />
              <rect x="52" y="58" width="7" height="6" fill="#2C3443" />
              <rect x="53" y="62" width="5" height="4" fill="#F3D5B5" />
            </g>
          )}
        </svg>
      </div>
    </div>
  );
};
