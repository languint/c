import { Chess } from "@rbxts/chess";
import { describe, expect, it } from "@rbxts/jest-globals";

describe("Board.Bitboard", () => {
	it("should initialize with all bits set to 0", () => {
		const bitboard = new Chess.Board.Bitboard();
		const matrix = bitboard.toMatrix();

		for (const row of matrix) {
			for (const bit of row) {
				expect(bit).toBe(0);
			}
		}
	});

	it("should set and get individual bits correctly", () => {
		const bitboard = new Chess.Board.Bitboard();
		bitboard.setBit(0, 0, true);
		bitboard.setBit(7, 7, true);

		expect(bitboard.getBit(0, 0)).toBe(true);
		expect(bitboard.getBit(7, 7)).toBe(true);
		expect(bitboard.getBit(0, 1)).toBe(false);
	});

	it("should fill all bits with a given value", () => {
		const bitboard = new Chess.Board.Bitboard();
		bitboard.fill(1);

		const matrix = bitboard.toMatrix();
		for (const row of matrix) {
			for (const bit of row) {
				expect(bit).toBe(1);
			}
		}

		bitboard.fill(0);
		for (const row of matrix) {
			for (const bit of row) {
				expect(bit).toBe(0);
			}
		}
	});

	it("should perform bitwise operations correctly", () => {
		const bitboard1 = new Chess.Board.Bitboard();
		const bitboard2 = new Chess.Board.Bitboard();

		bitboard1.setBit(0, 0, true);
		bitboard2.setBit(0, 0, true);
		bitboard2.setBit(7, 7, true);

		bitboard1.and(bitboard2);
		expect(bitboard1.getBit(0, 0)).toBe(true);
		expect(bitboard1.getBit(7, 7)).toBe(false);

		bitboard1.or(bitboard2);
		expect(bitboard1.getBit(7, 7)).toBe(true);

		bitboard1.not();
		expect(bitboard1.getBit(0, 0)).toBe(false);
	});

	it("should clone correctly", () => {
		const bitboard = new Chess.Board.Bitboard();
		bitboard.setBit(0, 0, true);

		const clone = bitboard.clone();
		expect(clone.getBit(0, 0)).toBe(true);
		expect(clone.getBit(7, 7)).toBe(false);

		clone.setBit(7, 7, true);
		expect(bitboard.getBit(7, 7)).toBe(false); // Ensure original is not modified
	});
});

describe("Board", () => {
	it("should initialize with the starting position", () => {
		const board = new Chess.Board.Board();
		expect(board.getFen()).toBe(Chess.Board.STARTING_POSITION);
	});

	it("should clear the board", () => {
		const board = new Chess.Board.Board();
		board.clear();

		expect(Chess.flatten(board.piecesBoard.toMatrix()).every((bit) => bit === 0)).toBe(true);
		expect(Chess.flatten(board.colorBoard.toMatrix()).every((bit) => bit === 0)).toBe(true);
	});

	it("should apply a FEN string correctly", () => {
		const board = new Chess.Board.Board();
		const fen = "8/8/8/8/8/8/8/R3K2R w KQ - 0 1";
		board.applyFen(fen);

		expect(board.getFen()).toBe(fen);
		expect(board.piecesBoard.getBit(7, 0)).toBe(true); // Rook
		expect(board.piecesBoard.getBit(7, 4)).toBe(true); // King
		expect(board.piecesBoard.getBit(7, 7)).toBe(true); // Rook
	});

	it("should set piece bits correctly", () => {
		const board = new Chess.Board.Board();
		board.setPieceBit(0, 0, "R");
		board.setPieceBit(7, 7, "k");

		expect(board.piecesBoard.getBit(0, 0)).toBe(true);
		expect(board.colorBoard.getBit(0, 0)).toBe(false); // White piece
		expect(board.piecesBoard.getBit(7, 7)).toBe(true);
		expect(board.colorBoard.getBit(7, 7)).toBe(true); // Black piece
	});

	it("should debug print without errors", () => {
		const board = new Chess.Board.Board();
		expect(() => board.debugPrint()).never.toThrowError();
	});
});
