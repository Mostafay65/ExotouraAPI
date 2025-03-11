const requestStatus = {
  pending: "PENDING", // user send a request
  holding: "HOLDING", // hoster selected a user but still in progress
  approved: "APPROVED", // approved when the user send mony to the hoster
  rejected: "REJECTED", // otherwise rejected
};
export default requestStatus;
