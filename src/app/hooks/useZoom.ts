import { useState, WheelEventHandler } from 'react';

export const useZoom = (step: number, min = 0.1, max = 5) => {
  const [zoom, setZoom] = useState<number>(1);

  const zoomIn = () => {
    setZoom((z) => {
      const newZ = z + step;
      return newZ > max ? z : newZ;
    });
  };

  const zoomOut = () => {
    setZoom((z) => {
      const newZ = z - step;
      return newZ < min ? z : newZ;
    });
  };

  const onWheel: WheelEventHandler<HTMLElement> = (evt) => {
    setZoom((z) => Math.min(Math.max(0.5, z + evt.deltaY * -0.001), 3.0));
  };

  return {
    zoom,
    setZoom,
    zoomIn,
    zoomOut,
    onWheel,
  };
};
