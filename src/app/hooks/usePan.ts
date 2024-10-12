import { MouseEventHandler, useEffect, useRef, useState } from 'react';

export type Pan = {
  translateX: number;
  translateY: number;
};

const INITIAL_PAN = {
  translateX: 0,
  translateY: 0,
};

export const usePan = (active: boolean) => {
  const [pan, setPan] = useState<Pan>(INITIAL_PAN);
  const [cursor, setCursor] = useState<'grab' | 'grabbing' | 'initial'>(
    active ? 'grab' : 'initial'
  );
  const lastPos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    setCursor(active ? 'grab' : 'initial');
  }, [active]);

  const handleMouseMove = (evt: MouseEvent) => {
    evt.preventDefault();
    evt.stopPropagation();

    setPan((p) => {
      const { translateX, translateY } = p;
      const mX = translateX + (evt.screenX - lastPos.current.x);
      const mY = translateY + (evt.screenY - lastPos.current.y);

      lastPos.current.x = evt.screenX;
      lastPos.current.y = evt.screenY;

      return { translateX: mX, translateY: mY };
    });
  };

  const handleMouseUp = (evt: MouseEvent) => {
    evt.preventDefault();
    setCursor('grab');

    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  const handleMouseDown: MouseEventHandler<HTMLElement> = (evt) => {
    if (!active) return;
    evt.preventDefault();
    setCursor('grabbing');
    lastPos.current.x = evt.screenX;
    lastPos.current.y = evt.screenY;

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  useEffect(() => {
    if (!active) setPan(INITIAL_PAN);
  }, [active]);

  return {
    pan,
    cursor,
    onMouseDown: handleMouseDown,
  };
};
