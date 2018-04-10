import * as api from '../common/api';

export const TokenLocalstorageKey = 'TokenLocalstorageKey';

export const loadGithubTokenFromLocalStorage = () => {
  return window.localStorage.getItem(TokenLocalstorageKey);
}

export const saveGithubToken = store => next => action => {
  const result = next(action)

  if (action.type === 'SET_GH_USER') {
    const { access_token } = store.getState();
    api.setGithubToken(access_token);
    window.localStorage.setItem(TokenLocalstorageKey, access_token);
  }

  return result;
}
