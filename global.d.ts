declare global {
  var unsubscribeAll: (() => void) | undefined;
  var addUnsubscribe: ((fn: () => void) => void) | undefined;
}

export { };

