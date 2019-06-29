import React from 'react';
import { InputLabel } from '@material-ui/core';
import { Slider } from '@material-ui/lab';
import useLongPress from './LongPress';

export default function BPMSlider({ min, max, height, selectedBpm, onBpmChange, onLongPress }) {
  return (
    <div>
      <InputLabel style={{ width: '100%' }} shrink>BPM</InputLabel>
      <div style={{ display: 'flex', height: height }}>
        <Slider
          {...useLongPress(onLongPress, 500)}
          orientation="vertical"
          min={min} max={max}
          value={selectedBpm}
          onChange={(e, newValue) => onBpmChange(e, newValue)}
          valueLabelDisplay="auto"
        />
      </div>
    </div>
  );
}
