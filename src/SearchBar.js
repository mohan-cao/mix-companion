import React from 'react';
import PropTypes from 'prop-types';
import { FormControl, TextField, Select, MenuItem, InputLabel } from '@material-ui/core';

const supportedValues = {
  "Track": "Never Gonna Give You Up, Robot Rock, Bad (Michael Jackson)",
  "Artist": "Kanye West, Jimi Hendrix",
  "Genre": "Pop, Rock, Country",
}

export default class SearchBar extends React.PureComponent {
  render() {
    const { style, type, value, onChange, GenreSelector } = this.props;
    const flexSizing = (style.flex ? { flex: style.flex } : { flexGrow: style.flexGrow, flexBasis: style.flexBasis, flexShrink: style.flexShrink })
    return (
      <FormControl style={style}>
        <InputLabel shrink style={{ whiteSpace: 'nowrap' }}>
          Type
        </InputLabel>
        <Select value={type} onChange={(e) => onChange({ type: e.target.value })} style={{ marginRight: 5 }}>
          <MenuItem value="Track">Track</MenuItem>
          <MenuItem value="Artist">Artist</MenuItem>
          <MenuItem value="Genre">Genre</MenuItem>
        </Select>
        {
          (type === "Genre") ?
          GenreSelector
          :
          <TextField
            value={value}
            onChange={(e) => onChange({ query: e.target.value })}
            style={flexSizing}
            placeholder={supportedValues[type]}
            InputLabelProps={{ shrink: true, disableAnimation: false }}
            label="Search"
          />
        }
      </FormControl>
    );
  }
}

SearchBar.defaultProps = {
  type: "Track"
}

SearchBar.propTypes = {
  type: PropTypes.oneOf(Object.keys(supportedValues))
}