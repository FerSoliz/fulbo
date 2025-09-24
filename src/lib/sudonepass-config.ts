

export const sudonepassConfig = {
  levels: 40,
  expPerLevel: (level: number) => {
    if (level >= 30) return 400;
    if (level >= 20) return 300;
    if (level >= 10) return 200;
    return 100;
  },
  actions: {
    editProfile: {
      exp: 200,
      once: true,
    },
    openPack: {
      exp: 25,
      once: false,
    },
    completeCollection: {
      exp: 500,
      once: true,
    },
    winMatch: {
      exp: 100,
      once: false,
    },
    drawMatch: {
      exp: 50,
      once: false,
    },
    loseMatch: {
      exp: 10,
      once: false,
    },
    scoreInMatch: {
      exp: 50,
      oncePerMatch: true,
    },
    winCompetition: {
      exp: 1000,
      once: false,
    },
  },
};
