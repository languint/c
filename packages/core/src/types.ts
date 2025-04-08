export enum Color {
	WHITE, // 0
	BLACK, // 1
}

// Differentiate between regular numbers, and numbers used for evaluation / search.
export type Value = number;

export type Square = { rank: number; file: number };

export type Move = { from: Square; to: Square; promotionPiece?: string };

export enum Directions {
	NORTH,
	SOUTH,
	EAST,
	WEST,
}
