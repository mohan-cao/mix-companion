import React from 'react';
import { withStyles, Select, MenuItem, FormControl, InputLabel, Input } from '@material-ui/core';

class KeySelector extends React.PureComponent {
  static camelotMinorKey = [
    "1A", "2A", "3A", "4A", "5A", "6A", "7A", "8A", "9A", "10A", "11A", "12A",
  ];
  static camelotMajorKey = [
    "1B", "2B", "3B", "4B", "5B", "6B", "7B", "8B", "9B", "10B", "11B", "12B",
  ];
  render() {
    const { classes, camelotKey, onChange, style } = this.props;
    return (
      <FormControl style={style}>
        <InputLabel shrink htmlFor="key">
          Key
        </InputLabel>
        <Select input={<Input name="key" />} name="key" value={camelotKey} onChange={(e) => onChange(e)}>
          <MenuItem disabled className={classes.group}>Minor keys</MenuItem>
          {KeySelector.camelotMinorKey.map((x) => <MenuItem key={x} className={classes.item} value={x}>{x}</MenuItem>)}
          <MenuItem disabled className={classes.group}>Major keys</MenuItem>
          {KeySelector.camelotMajorKey.map((x) => <MenuItem key={x} className={classes.item} value={x}>{x}</MenuItem>)}
        </Select>
      </FormControl>
    );
  }
}

const styles = (theme) => ({
  item: {
    paddingLeft: theme.spacing(3),
  },
  group: {
    fontWeight: theme.typography.fontWeightMedium,
    opacity: 1,
  },
  MenuItem: {
    paddingLeft: theme.spacing(3)
  },
  MenuGroup: {
    fontWeight: theme.typography.fontWeightMedium,
    opacity: 1,
    cursor: "default",
    "&:hover": {
      backgroundColor: "transparent !important"
    }
  }
})

export default withStyles(styles)(KeySelector)