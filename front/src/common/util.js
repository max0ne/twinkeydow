import { toast as _toast } from 'react-toastify';

export function toastError(err) {
  _toast((err.response && err.response.body && err.response.body.status) || err.toString());
}

export function toast(...params) {
  _toast(...params);
}

export const getBaseName = () => urlParse(process.env.PUBLIC_URL).pathname;
