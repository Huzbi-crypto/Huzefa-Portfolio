'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  AvatarHotspotId,
  AvatarActionState,
  ROOM_HOTSPOTS,
  HotspotCoordinates,
} from '@/types/avatar';

export interface UseAvatarMotionProps {
  initialHotspot?: AvatarHotspotId;
  onArrival?: (hotspot: HotspotCoordinates) => void;
}

export function useAvatarMotion({
  initialHotspot = 'desk-monitor',
  onArrival,
}: UseAvatarMotionProps = {}) {
  const [currentHotspotId, setCurrentHotspotId] = useState<AvatarHotspotId>(initialHotspot);
  const [actionState, setActionState] = useState<AvatarActionState>(
    ROOM_HOTSPOTS[initialHotspot].action
  );
  const [coords, setCoords] = useState<{ x: number; bottom: number }>({
    x: ROOM_HOTSPOTS[initialHotspot].x,
    bottom: ROOM_HOTSPOTS[initialHotspot].bottom,
  });
  const [facingRight, setFacingRight] = useState<boolean>(true);
  const [transitDuration, setTransitDuration] = useState<number>(850);
  const [isMoving, setIsMoving] = useState<boolean>(false);

  const transitTimerRef = useRef<NodeJS.Timeout | null>(null);

  const moveToHotspot = useCallback(
    (targetId: AvatarHotspotId, onArriveCallback?: () => void) => {
      const target = ROOM_HOTSPOTS[targetId];
      if (!target) return;

      if (transitTimerRef.current) {
        clearTimeout(transitTimerRef.current);
      }

      // 1. Calculate Euclidean distance
      const dx = target.x - coords.x;
      const dy = target.bottom - coords.bottom;
      const distance = Math.hypot(dx, dy);

      // If already at target coordinates, switch state directly without walking
      if (distance < 1.5) {
        setActionState(target.action);
        setCurrentHotspotId(targetId);
        if (target.facing === 'left') setFacingRight(false);
        if (target.facing === 'right') setFacingRight(true);
        if (onArriveCallback) onArriveCallback();
        if (onArrival) onArrival(target);
        return;
      }

      // 2. Determine facing direction
      if (Math.abs(dx) > 1) {
        setFacingRight(dx > 0);
      } else if (target.facing !== 'front') {
        setFacingRight(target.facing === 'right');
      }

      // 3. Dynamic transit duration based on distance (750ms to 1250ms)
      const calculatedDuration = Math.round(Math.min(1250, Math.max(750, distance * 16)));
      setTransitDuration(calculatedDuration);

      // 4. Set walking motion state
      setIsMoving(true);
      setActionState('walking');
      setCurrentHotspotId(targetId);
      setCoords({ x: target.x, bottom: target.bottom });

      // 5. Schedule arrival pose & action callback
      transitTimerRef.current = setTimeout(() => {
        setIsMoving(false);
        setActionState(target.action);
        if (target.facing === 'left') setFacingRight(false);
        if (target.facing === 'right') setFacingRight(true);

        if (onArriveCallback) onArriveCallback();
        if (onArrival) onArrival(target);
      }, calculatedDuration);
    },
    [coords, onArrival]
  );

  useEffect(() => {
    return () => {
      if (transitTimerRef.current) clearTimeout(transitTimerRef.current);
    };
  }, []);

  return {
    currentHotspotId,
    actionState,
    coords,
    facingRight,
    transitDuration,
    isMoving,
    currentHotspot: ROOM_HOTSPOTS[currentHotspotId],
    moveToHotspot,
    setActionState,
  };
}
