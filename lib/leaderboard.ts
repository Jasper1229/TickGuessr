// Static mock data for the MVP. Replace with a DB query when persistence lands.
export const MOCK: Record<string, { name: string; score: number }[]> = {
  all: [
    { name: "PixelMaster_99", score: 9120 }, { name: "RedstonePro", score: 6181 },
    { name: "TickHero", score: 3875 }, { name: "NetherSpeed", score: 3258 },
    { name: "CreeperKing", score: 2840 }, { name: "Lavacast", score: 2100 },
  ],
  fire: [
    { name: "PixelMaster_99", score: 7420 }, { name: "RedstonePro", score: 5210 },
    { name: "TickHero", score: 3875 }, { name: "NetherSpeed", score: 3258 },
    { name: "Blazey", score: 2410 }, { name: "EmberFox", score: 1900 },
  ],
};
