import React from 'react';
import useResizeObserver from "use-resize-observer";

const ResizableFlexbox = ({ childrenWidth, children, style }) => {
  const [ref, width] = useResizeObserver();
  return (<div ref={ref} style={{
    width: '100%',
    display: 'flex',
    justifyContent: 'center'
  }}>
    <div style={{
      width: Math.floor(width / childrenWidth) * childrenWidth,// + padding,
      display: 'flex', flexDirection: 'row',
      justifyContent: 'flex-start', alignItems: 'center',
      flexWrap: 'wrap',
      ...style
    }}>
      {children}
    </div>
  </div>);
};

export default ResizableFlexbox;
