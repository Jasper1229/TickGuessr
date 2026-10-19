// Sprite registry. To add a block: drop sprite sheets in assets/sprites/ and add an entry here.
// Sheets are vertical strips of square frames (the Minecraft animated texture layout).
export type Sheet = { file: string; frames: number; size: number };
export type Block = { id: string; name: string; flip: boolean; sheets: Sheet[] };

export const BLOCKS: Block[] = [
  {
    id: "fire",
    name: "Fire",
    flip: true,
    sheets: [
      { file: "fire_0.png", frames: 32, size: 16 },
      { file: "fire_1.png", frames: 32, size: 16 },
    ],
  },
];

export const getBlock = (id: string) => BLOCKS.find((b) => b.id === id);
