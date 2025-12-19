'use client';

import { useEffect, useRef } from 'react';
import Typed from 'typed.js';

interface TypedTextProps {
  strings: string[];
  className?: string;
  speed?: number;
  backSpeed?: number;
  loop?: boolean;
  showCursor?: boolean;
  cursorChar?: string;
  startDelay?: number;
  backDelay?: number;
  smartBackspace?: boolean;
  shuffle?: boolean;
  fadeOut?: boolean;
  fadeOutDelay?: number;
  onComplete?: () => void;
}

export default function TypedText({
  strings,
  className = '',
  speed = 50,
  backSpeed = 30,
  loop = true,
  showCursor = true,
  cursorChar = '|',
  startDelay = 0,
  backDelay = 1500,
  smartBackspace = true,
  shuffle = false,
  fadeOut = false,
  fadeOutDelay = 500,
  onComplete,
}: TypedTextProps) {
  const typedRef = useRef<HTMLSpanElement>(null);
  const typedInstance = useRef<Typed | null>(null);

  useEffect(() => {
    if (!typedRef.current) return;

    const options = {
      strings,
      typeSpeed: speed,
      backSpeed,
      loop,
      showCursor,
      cursorChar,
      startDelay,
      backDelay,
      smartBackspace,
      shuffle,
      fadeOut,
      fadeOutDelay,
      onComplete: (self: Typed) => {
        if (onComplete) onComplete();
      },
    };

    typedInstance.current = new Typed(typedRef.current, options);

    return () => {
      if (typedInstance.current) {
        typedInstance.current.destroy();
      }
    };
  }, [strings, speed, backSpeed, loop, showCursor, cursorChar, startDelay, backDelay, smartBackspace, shuffle, fadeOut, fadeOutDelay, onComplete]);

  return <span ref={typedRef} className={className} />;
}
