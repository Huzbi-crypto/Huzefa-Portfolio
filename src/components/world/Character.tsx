'use client';

import React, { useState, useEffect, useRef } from 'react';

export type CharacterAction = 'idle' | 'typing' | 'reading' | 'looking';

export interface CharacterProps {
  state?: CharacterAction;
  cursorPos?: { x: number; y: number }; // normalized coords between -1 and 1
  onStateChange?: (state: CharacterAction) => void;
  className?: string;
  isLampOn?: boolean;
}

const DIALOGUES = [
  "hey... it's 2:14 AM and this code is finally running.",
  "just one more One Piece chapter, then I'll sleep (lies).",
  "bleach bankai scenes never get old.",
  "naruto's resolve honestly fuels my late-night debugging.",
  "asta's anti-magic grind: never give up, even with zero magic.",
  "saitama's serious punch would probably break my compiler.",
  "dijkstra's shortest path never disappoints.",
  "tea is still warm. good sign.",
  "38 repos on GitHub and still dreaming up more.",
  "click the CRT monitor to test my mini terminal!",
  "welcome to my room. make yourself at home.",
];

export const Character: React.FC<CharacterProps> = ({
  state = 'idle',
  cursorPos = { x: 0, y: 0 },
  onStateChange,
  className = '',
  isLampOn = true,
}) => {
  const [blinking, setBlinking] = useState<boolean>(false);
  const [dialogueIndex, setDialogueIndex] = useState<number>(0);
  const [showSpeechBubble, setShowSpeechBubble] = useState<boolean>(false);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [typingTick, setTypingTick] = useState<number>(0);
  const dialogueTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Blinking loop (every 3.5 to 5.5 seconds)
  useEffect(() => {
    let blinkTimer: NodeJS.Timeout;
    const triggerBlink = () => {
      setBlinking(true);
      setTimeout(() => {
        setBlinking(false);
      }, 140);

      const nextDelay = 3000 + Math.random() * 2500;
      blinkTimer = setTimeout(triggerBlink, nextDelay);
    };

    blinkTimer = setTimeout(triggerBlink, 3200);
    return () => clearTimeout(blinkTimer);
  }, []);

  // Typing animation cycle when state is 'typing'
  useEffect(() => {
    if (state !== 'typing') return;
    const interval = setInterval(() => {
      setTypingTick((prev) => (prev + 1) % 4);
    }, 150);
    return () => clearInterval(interval);
  }, [state]);

  const handleCharacterClick = () => {
    const nextIndex = (dialogueIndex + 1) % DIALOGUES.length;
    setDialogueIndex(nextIndex);
    setShowSpeechBubble(true);

    // If onStateChange is provided, cycle through looking/idle/reading
    if (onStateChange && state !== 'typing') {
      const nextStates: CharacterAction[] = ['idle', 'looking', 'reading'];
      const nextIdx = (nextStates.indexOf(state) + 1) % nextStates.length;
      onStateChange(nextStates[nextIdx]);
    }

    if (dialogueTimeoutRef.current) {
      clearTimeout(dialogueTimeoutRef.current);
    }
    dialogueTimeoutRef.current = setTimeout(() => {
      setShowSpeechBubble(false);
    }, 4500);
  };

  // Eye tracking offsets based on cursorPos (-1 to 1)
  const eyeOffsetX = Math.max(-1.5, Math.min(1.5, cursorPos.x * 1.5));
  const eyeOffsetY = Math.max(-1, Math.min(1, cursorPos.y * 1));

  // Head tilt for looking
  const headRotation = state === 'looking' ? cursorPos.x * 3 : 0;

  return (
    <div
      className={`relative inline-block select-none cursor-pointer transition-transform duration-300 ${className}`}
      onClick={handleCharacterClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      title="Huzbi (Click to talk!)"
      role="img"
      aria-label="Pixel art representation of Huzbi"
    >
      {/* Speech / Thought Bubble - Solid opaque background, elevated z-index, positioned to avoid CRT overlap */}
      {(showSpeechBubble || isHovered) && (
        <div
          className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 sm:left-auto sm:right-[-40px] sm:translate-x-0 z-50 pointer-events-none transition-all duration-200"
          style={{ width: 'max-content', maxWidth: '240px' }}
        >
          <div
            className="relative border-2 border-accent text-fg font-mono text-[11px] px-3.5 py-2 rounded-xl shadow-2xl leading-snug"
            style={{
              backgroundColor: 'var(--color-bg-deep)',
              borderColor: 'var(--color-accent)',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.95), 0 0 12px var(--color-glow)'
            }}
          >
            <span className="text-accent font-bold mr-1.5">&gt;</span>
            {DIALOGUES[dialogueIndex]}
            {/* Bubble arrow pointing towards Huzbi */}
            <div
              className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 sm:left-10 w-2.5 h-2.5 border-r-2 border-b-2 rotate-45"
              style={{
                backgroundColor: 'var(--color-bg-deep)',
                borderColor: 'var(--color-accent)'
              }}
            />
          </div>
        </div>
      )}

      {/* SVG Pixel-Art Huzbi Character */}
      <svg
        viewBox="0 0 80 90"
        className="w-32 h-36 sm:w-36 sm:h-40 md:w-40 md:h-44 pixelated drop-shadow-md overflow-visible"
        shapeRendering="crispEdges"
      >
        <defs>
          {/* Subtle glow filter for headphones LED */}
          <filter id="ledGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="0" stdDeviation="1" floodColor="var(--color-accent)" floodOpacity="0.8" />
          </filter>
        </defs>

        {/* --- CHAIR BACKREST (Ergonomic Swivel Chair) --- */}
        <g id="chair">
          {/* Chair Headrest */}
          <rect x="26" y="10" width="28" height="12" fill="#141820" rx="1" />
          <rect x="28" y="12" width="24" height="8" fill="#1E232E" />
          <rect x="30" y="14" width="20" height="4" fill="#29303F" />

          {/* Chair Main Back */}
          <rect x="22" y="24" width="36" height="34" fill="#141820" />
          <rect x="25" y="26" width="30" height="30" fill="#1A1F2B" />
          <rect x="28" y="28" width="24" height="26" fill="#232A39" />
          {/* Stitching / Cushion Lines */}
          <rect x="28" y="38" width="24" height="1" fill="#141820" />
          <rect x="39" y="28" width="2" height="26" fill="#141820" />

          {/* Chair Armrests */}
          <rect x="16" y="44" width="6" height="16" fill="#12161E" />
          <rect x="14" y="42" width="10" height="3" fill="#252D3C" />
          <rect x="58" y="44" width="6" height="16" fill="#12161E" />
          <rect x="56" y="42" width="10" height="3" fill="#252D3C" />

          {/* Chair Base Stem */}
          <rect x="37" y="74" width="6" height="12" fill="#11141B" />
          <rect x="24" y="84" width="32" height="4" fill="#161B24" />
          {/* Casters */}
          <rect x="22" y="87" width="4" height="3" fill="#0D0F15" />
          <rect x="54" y="87" width="4" height="3" fill="#0D0F15" />
          <rect x="38" y="87" width="4" height="3" fill="#0D0F15" />
        </g>

        {/* --- HUZBI BODY & CHEST (Gentle Breathing Animation via CSS) --- */}
        <g
          id="huzbi-body"
          className="transition-transform duration-500 ease-out"
          style={{
            transform: state === 'idle' ? 'translateY(0px)' : 'none',
          }}
        >
          {/* Cozy Dark Hoodie Torso */}
          <rect x="27" y="45" width="26" height="26" fill="#222834" />
          <rect x="29" y="47" width="22" height="22" fill="#2C3443" />
          {/* Hoodie Pocket Kangaroo Style */}
          <rect x="31" y="58" width="18" height="9" fill="#1E232E" />
          <rect x="33" y="60" width="14" height="5" fill="#252C39" />
          {/* Hoodie Drawstrings */}
          <rect x="36" y="48" width="1" height="6" fill="#A8D672" opacity="0.8" />
          <rect x="43" y="48" width="1" height="7" fill="#A8D672" opacity="0.8" />

          {/* Legs / Jeans */}
          <rect x="30" y="71" width="9" height="12" fill="#1A202A" />
          <rect x="41" y="71" width="9" height="12" fill="#171C26" />
          {/* Shoes */}
          <rect x="28" y="82" width="11" height="4" fill="#E8E6DD" />
          <rect x="28" y="84" width="12" height="2" fill="#A8D672" />
          <rect x="41" y="82" width="11" height="4" fill="#E8E6DD" />
          <rect x="40" y="84" width="12" height="2" fill="#A8D672" />
        </g>

        {/* --- HEAD & NECK (Subtle Tilt towards cursor) --- */}
        <g
          id="huzbi-head"
          style={{
            transformOrigin: '40px 38px',
            transform: `rotate(${headRotation}deg)`,
            transition: 'transform 180ms ease-out',
          }}
        >
          {/* Neck */}
          <rect x="37" y="41" width="6" height="5" fill="#DEB887" />
          <rect x="38" y="43" width="4" height="3" fill="#C59B67" />

          {/* Face Base */}
          <rect x="31" y="24" width="18" height="18" fill="#F3D5B5" />
          {/* Face Shadow / Chin */}
          <rect x="34" y="40" width="12" height="2" fill="#DEB887" />
          <rect x="32" y="38" width="16" height="2" fill="#E5C39E" />

          {/* Cute subtle blush */}
          <rect x="32" y="34" width="3" height="1" fill="#E69575" opacity="0.6" />
          <rect x="45" y="34" width="3" height="1" fill="#E69575" opacity="0.6" />

          {/* Nose (tiny pixel) */}
          <rect x="39" y="33" width="2" height="2" fill="#D9A979" />

          {/* Mouth */}
          {state === 'reading' ? (
            // Focused slight open mouth
            <rect x="38" y="37" width="4" height="2" fill="#5A3D28" />
          ) : state === 'typing' ? (
            // Small smirk
            <g>
              <rect x="38" y="37" width="4" height="1" fill="#5A3D28" />
              <rect x="42" y="36" width="1" height="1" fill="#5A3D28" />
            </g>
          ) : (
            // Chill neutral line
            <rect x="38" y="37" width="4" height="1" fill="#6E4A35" />
          )}

          {/* Eyes & Eyebrows */}
          {blinking ? (
            // Blink closed eyes
            <g id="eyes-closed">
              <rect x="33" y="31" width="4" height="1" fill="#2E1C12" />
              <rect x="43" y="31" width="4" height="1" fill="#2E1C12" />
            </g>
          ) : (
            // Open Eyes with tracking pupils
            <g id="eyes-open">
              {/* Eyebrows */}
              <rect x="33" y="28" width="4" height="1" fill="#1C1512" />
              <rect x="43" y="28" width="4" height="1" fill="#1C1512" />

              {/* Eye Whites */}
              <rect x="33" y="30" width="4" height="3" fill="#FFFFFF" />
              <rect x="43" y="30" width="4" height="3" fill="#FFFFFF" />

              {/* Pupils with cursor tracking */}
              <rect
                x={34 + eyeOffsetX}
                y={30.5 + eyeOffsetY}
                width="2"
                height="2"
                fill="#1C1512"
              />
              <rect
                x={44 + eyeOffsetX}
                y={30.5 + eyeOffsetY}
                width="2"
                height="2"
                fill="#1C1512"
              />

              {/* Eye Catchlight (shiny pixel) */}
              <rect
                x={34.5 + eyeOffsetX * 0.4}
                y={30.5}
                width="1"
                height="1"
                fill="#FFFFFF"
              />
              <rect
                x={44.5 + eyeOffsetX * 0.4}
                y={30.5}
                width="1"
                height="1"
                fill="#FFFFFF"
              />
            </g>
          )}

          {/* Messy Anime-Inspired Dark Hair */}
          <g id="hair">
            {/* Hair Base */}
            <rect x="30" y="19" width="20" height="7" fill="#181415" />
            <rect x="29" y="21" width="22" height="4" fill="#251F21" />

            {/* Messy Hair Bangs */}
            <rect x="30" y="24" width="4" height="4" fill="#181415" />
            <rect x="33" y="24" width="3" height="3" fill="#2C2426" />
            <rect x="36" y="24" width="3" height="2" fill="#181415" />
            <rect x="40" y="24" width="4" height="3" fill="#251F21" />
            <rect x="44" y="24" width="5" height="4" fill="#181415" />

            {/* Hair Strands / Cowlicks Top */}
            <rect x="32" y="17" width="3" height="3" fill="#181415" />
            <rect x="37" y="16" width="4" height="4" fill="#2C2426" />
            <rect x="43" y="17" width="4" height="3" fill="#181415" />
            <rect x="47" y="19" width="3" height="3" fill="#251F21" />

            {/* Hair Highlights */}
            <rect x="34" y="20" width="4" height="1" fill="#3D3438" />
            <rect x="41" y="20" width="5" height="1" fill="#3D3438" />
          </g>

          {/* Retro Over-Ear Headphones */}
          <g id="headphones">
            {/* Headband */}
            <rect x="28" y="18" width="2" height="7" fill="#3A404D" />
            <rect x="30" y="16" width="20" height="2" fill="#2A303D" />
            <rect x="50" y="18" width="2" height="7" fill="#3A404D" />

            {/* Left Earcup */}
            <rect x="27" y="25" width="4" height="10" fill="#1B202A" rx="1" />
            <rect x="28" y="27" width="2" height="6" fill="#31394B" />
            {/* Glow LED Dot (changes with theme or lamp) */}
            <rect
              x="28"
              y="29"
              width="2"
              height="2"
              fill={isLampOn ? 'var(--color-accent)' : '#445533'}
              filter="url(#ledGlow)"
            />

            {/* Right Earcup */}
            <rect x="49" y="25" width="4" height="10" fill="#1B202A" rx="1" />
            <rect x="50" y="27" width="2" height="6" fill="#31394B" />
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

        {/* --- ARMS / HANDS BASED ON ACTION STATE --- */}
        {state === 'typing' ? (
          // Typing: Hands actively tapping alternating keys
          <g id="arms-typing">
            {/* Left Arm & Sleeve */}
            <rect x="20" y="48" width="8" height="12" fill="#222834" />
            <rect x="24" y="56" width="8" height="6" fill="#2C3443" />
            {/* Left Hand tapping */}
            <rect
              x="30"
              y={58 + (typingTick % 2 === 0 ? 2 : 0)}
              width="6"
              height="4"
              fill="#F3D5B5"
            />

            {/* Right Arm & Sleeve */}
            <rect x="52" y="48" width="8" height="12" fill="#222834" />
            <rect x="48" y="56" width="8" height="6" fill="#2C3443" />
            {/* Right Hand tapping */}
            <rect
              x="44"
              y={58 + (typingTick % 2 === 1 ? 2 : 0)}
              width="6"
              height="4"
              fill="#F3D5B5"
            />
          </g>
        ) : state === 'reading' ? (
          // Reading: Holding a pixel manga book!
          <g id="arms-reading">
            {/* Left & Right arms angling inwards */}
            <rect x="22" y="48" width="8" height="12" fill="#222834" />
            <rect x="26" y="54" width="7" height="8" fill="#2C3443" />
            <rect x="50" y="48" width="8" height="12" fill="#222834" />
            <rect x="47" y="54" width="7" height="8" fill="#2C3443" />

            {/* Manga Book Cover & Pages */}
            <g id="manga-volume">
              {/* Spine & Back */}
              <rect x="31" y="52" width="18" height="15" fill="#992222" />
              {/* Pages */}
              <rect x="33" y="53" width="14" height="13" fill="#FDFBF7" />
              <rect x="39" y="53" width="2" height="13" fill="#D3CEBF" />
              {/* Manga illustration lines */}
              <rect x="34" y="55" width="4" height="3" fill="#1C1C1C" />
              <rect x="34" y="60" width="3" height="4" fill="#3D3D3D" />
              <rect x="42" y="55" width="4" height="5" fill="#1C1C1C" />
              <rect x="42" y="62" width="3" height="2" fill="#7C7C7C" />
            </g>

            {/* Thumbs holding book edges */}
            <rect x="30" y="60" width="3" height="4" fill="#F3D5B5" />
            <rect x="47" y="60" width="3" height="4" fill="#F3D5B5" />
          </g>
        ) : (
          // Idle / Looking: Relaxed hands on desk or armrests
          <g id="arms-idle">
            {/* Left Arm */}
            <rect x="20" y="48" width="8" height="14" fill="#222834" />
            <rect x="21" y="58" width="7" height="6" fill="#2C3443" />
            <rect x="22" y="62" width="5" height="4" fill="#F3D5B5" />

            {/* Right Arm */}
            <rect x="52" y="48" width="8" height="14" fill="#222834" />
            <rect x="52" y="58" width="7" height="6" fill="#2C3443" />
            <rect x="53" y="62" width="5" height="4" fill="#F3D5B5" />
          </g>
        )}
      </svg>

      {/* State Badge Pill */}
      <div className="flex items-center justify-center mt-1">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-bg-surface/80 border border-border text-[10px] font-mono text-accent">
          <span className={`w-1.5 h-1.5 rounded-full ${state === 'typing' ? 'bg-accent animate-ping' : 'bg-accent'}`} />
          {state.toUpperCase()}
        </span>
      </div>
    </div>
  );
};
