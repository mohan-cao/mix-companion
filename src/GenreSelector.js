import React from 'react';
import { Select, MenuItem, FormControl, InputLabel, Input } from '@material-ui/core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSync } from '@fortawesome/free-solid-svg-icons'

export default class GenreSelector extends React.PureComponent {
  render() {
    const { selectedGenre, availableGenres, onChange, onRefreshClicked, style } = this.props;
    return (
      <FormControl style={style}>
        <InputLabel shrink htmlFor="genre" style={{ whiteSpace: 'nowrap' }}>
          <span style={{ verticalAlign: 'top' }}>Genre</span>
          <div style={{ display: 'inline', marginLeft: 4 }} onClick={() => onRefreshClicked()}>
            <FontAwesomeIcon icon={faSync} style={{ color: '#393' }} />
          </div>
        </InputLabel>
        <Select
          style={{ minWidth: 70, flex: 1 }}
          multiple
          input={<Input name="genre" />}
          value={selectedGenre}
          onChange={(e) => onChange(e.target.value)}
        >
          {(availableGenres && availableGenres.length > 0 ?
            availableGenres.map((x) => <MenuItem key={x} value={x}>{x.replace(/-/g, ' ')}</MenuItem>) : <MenuItem>No genres available</MenuItem>)}
        </Select>
      </FormControl>
    );
  }
}
