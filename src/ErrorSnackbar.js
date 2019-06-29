import React from 'react';
import { Snackbar } from '@material-ui/core';

export default function ErrorSnackbar({ open, error, onClose }) {
  return (<Snackbar anchorOrigin={{
    vertical: 'bottom',
    horizontal: 'left',
  }} open={open} onClose={onClose} autoHideDuration={6000} ContentProps={{
    'aria-describedby': 'message-id',
  }} message={<span id="message-id">Error: {error} </span>} />);
}
