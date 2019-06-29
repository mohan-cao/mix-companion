import { useState, useEffect } from 'react';

export default function useLongPress(callback = () => {}, ms = 300) {
  const [startLongPress, setStartLongPress] = useState(false);

  useEffect(() => {
    let timerId;
    if (startLongPress) {
      timerId = setTimeout(callback, ms);
    } else {
      clearTimeout(timerId);
    }

    return () => {
      clearTimeout(timerId);
    };
  }, [callback, ms, startLongPress]);

  return {
    onMouseDown: () => { setStartLongPress(true); return true; },
    onMouseUp: () => { setStartLongPress(false); return true; },
    onMouseLeave: () => { setStartLongPress(false); return true; },
    onTouchStart: () => { setStartLongPress(true); return true; },
    onTouchEnd: () => { setStartLongPress(false); return true; },
  };
}