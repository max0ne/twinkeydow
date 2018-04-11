
export default (state = { currentUser: undefined }, action) => {
  switch (action.type) {
    case 'SET_GH_USER':
      return {
        ...state,
        access_token: action.access_token,
        user: action.user,
      }
    case 'CLEAR_GH_USER':
      return {
        ...state,
        access_token: undefined,
        user: undefined,
      };
    default:
      return state
  }
};
