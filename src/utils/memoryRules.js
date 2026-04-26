export const MEMORY_CONFLICT_RULES = {
  preference: {
    strategy: "replace",     // latest wins
    decayOld: true,
  },

  profile: {
    strategy: "confirm",     // ask user if conflicting
    decayOld: false,
  },

  habit: {
    strategy: "merge",       // slowly adapt
    decayOld: true,
  },

  context: {
    strategy: "replace",     // temporary
    decayOld: true,
  },
};
