import React from 'react';
import useResizeObserver from "use-resize-observer";

const ResizableFlexbox = ({ childrenWidth, children }) => {
  const [ref, width] = useResizeObserver();
  return (<div ref={ref} style={{
    width: '100%',
    display: 'flex',
    justifyContent: 'center'
  }}>
    <div style={{
      width: Math.floor(width / childrenWidth) * childrenWidth + 1,
      display: 'flex', flexDirection: 'row',
      justifyContent: 'flex-start', alignItems: 'center',
      flexWrap: 'wrap'
    }}>
      {children}
    </div>
  </div>);
};

export default ResizableFlexbox;
