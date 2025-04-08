import { Color } from "./types";

export namespace Board {
	// Boards are buffers under-the-hood, this allows us to optimize a lot.
	export class Bitboard {
		private bits: buffer = buffer.create(8);

		getBits(): buffer {
			return this.bits;
		}

		setBits(bits: buffer) {
			this.bits = bits;
		}

		// Set all bits to 1 or 0.
		fill(value: number) {
			if (value !== 0 && value !== 1) error(`Bitboard::fill(): Invalid value: ${value}!`);

			const byteValue = value === 1 ? 0xff : 0x00;
			buffer.fill(this.bits, 0, byteValue, buffer.len(this.bits));
		}

		getBit(rank: number, file: number): boolean {
			const index = rank * 8 + file;
			const byteIndex = (index / 8) | 0;
			const bitIndex = index % 8;
			const byte = buffer.readu8(this.bits, byteIndex);
			return bit32.band(byte, bit32.lshift(1, bitIndex)) !== 0;
		}

		setBit(rank: number, file: number, value: boolean): void {
			const index = rank * 8 + file;
			const byteIndex = (index / 8) | 0;
			const bitIndex = index % 8;
			let byte = buffer.readu8(this.bits, byteIndex);

			if (value) {
				byte = bit32.bor(byte, bit32.lshift(1, bitIndex));
			} else {
				byte = bit32.band(byte, bit32.bnot(bit32.lshift(1, bitIndex)));
			}

			buffer.writeu8(this.bits, byteIndex, byte);
		}

		// For pretty-printing, etc.
		toMatrix(): number[][] {
			const matrix: number[][] = [];

			for (let rank = 0; rank < 8; rank++) {
				const row: number[] = [];
				for (let file = 0; file < 8; file++) {
					row.push(this.getBit(rank, file) ? 1 : 0);
				}
				matrix.push(row);
			}

			return matrix;
		}

		and(bb: Bitboard): void {
			const other = bb.getBits();
			const len = buffer.len(this.bits);

			for (let i = 0; i < len; i++) {
				const a = buffer.readu8(this.bits, i);
				const b = buffer.readu8(other, i);
				buffer.writeu8(this.bits, i, bit32.band(a, b));
			}
		}

		or(bb: Bitboard): void {
			const other = bb.getBits();
			const len = buffer.len(this.bits);

			for (let i = 0; i < len; i++) {
				const a = buffer.readu8(this.bits, i);
				const b = buffer.readu8(other, i);
				buffer.writeu8(this.bits, i, bit32.bor(a, b));
			}
		}

		not(): void {
			const len = buffer.len(this.bits);
			for (let i = 0; i < len; i++) {
				const byte = buffer.readu8(this.bits, i);
				buffer.writeu8(this.bits, i, bit32.bnot(byte) & 0xff); // Mask to 8 bits
			}
		}

		clone(): Bitboard {
			const copy = new Bitboard();
			buffer.copy(copy.getBits(), 0, this.bits, 0);
			return copy;
		}
	}

	export const STARTING_POSITION = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

	export class Board {
		private fen: string;

		// Bitboards
		public piecesBoard: Bitboard = new Bitboard(); // 1 where there is a piece, 0 where there is not.
		public colorBoard: Bitboard = new Bitboard(); // 1 where a black piece exists, 0 where white / none is. & with pieces for white.
		public pawnsBoard: Bitboard = new Bitboard();
		public knightsBoard: Bitboard = new Bitboard();
		public bishopsBoard: Bitboard = new Bitboard();
		public rooksBoard: Bitboard = new Bitboard();
		public queensBoard: Bitboard = new Bitboard();
		public kingsBoard: Bitboard = new Bitboard();

		public currentMove: Color = Color.WHITE;
		public halfMoves: number = 0; // Ply since the last capture or pawn advance, for the 50 move rule.
		public fullMoves: number = 1; // Number of full moves, incremented after Black's move.
		public enPassantPossible: boolean = false;
		public castlingRights: string;

		constructor(fen?: string) {
			this.fen = fen ?? STARTING_POSITION;
			this.applyFen();
		}

		clear(resetMoves?: boolean) {
			this.piecesBoard.fill(0);
			this.colorBoard.fill(0);
			this.pawnsBoard.fill(0);
			this.knightsBoard.fill(0);
			this.bishopsBoard.fill(0);
			this.rooksBoard.fill(0);
			this.queensBoard.fill(0);
			this.kingsBoard.fill(0);
			this.castlingRights = "";
			if (resetMoves) {
				this.currentMove = Color.WHITE;
				this.halfMoves = 0;
				this.fullMoves = 1;
				this.enPassantPossible = false;
			}
		}

		applyFen(fen?: string) {
			if (fen) this.fen = fen;
			this.clear(true);

			const fields = this.fen?.split(" "); // First split by spaces for the different fields.

			if (fields?.size() !== 6)
				error(`Board::applyFen(): Invalid FEN, FEN string must have 6 fields, provided: ${this.fen}!`);

			const [piecesField, playerToMove, castlingRights, enPassantSquare, halfMoves, fullMoves] = [...fields];

			// Apply metadata
			this.currentMove = playerToMove === "w" ? Color.WHITE : Color.BLACK;

			// Since tonumber can fail if the string is invalid, default to 0.
			this.halfMoves = tonumber(halfMoves) ?? 0;
			this.fullMoves = tonumber(fullMoves) ?? 0;
			this.enPassantPossible = enPassantSquare !== "-"; // If a square is not specified (-), then en passant is impossible in the position.
			this.castlingRights = castlingRights;

			const rows = piecesField.split("/");

			for (let r = 0; r < 8; r++) {
				const row = rows[r];
				let f = 0; // <0-7> : <A-H>
				for (let char of row) {
					if (tonumber(char) !== undefined && tonumber(char)! >= 1 && tonumber(char)! <= 8) {
						f += tonumber(char)!;
					} else {
						this.setPieceBit(r, f, char);
						f++;
					}
				}
			}
		}

		setPieceBit(rank: number, file: number, pieceChar: string) {
			const isWhite = string.upper(pieceChar) === pieceChar; // If the capital is the same, then it's a white piece.
			this.colorBoard.setBit(rank, file, !isWhite);
			this.piecesBoard.setBit(rank, file, true); // There is now a piece at (rank, file).

			pieceChar = string.lower(pieceChar); // Convert to lower case, since the case sensitive part is done.

			switch (pieceChar) {
				case "p":
					this.pawnsBoard.setBit(rank, file, true);
					break;
				case "n":
					this.knightsBoard.setBit(rank, file, true);
					break;
				case "b":
					this.bishopsBoard.setBit(rank, file, true);
					break;
				case "r":
					this.rooksBoard.setBit(rank, file, true);
					break;
				case "q":
					this.queensBoard.setBit(rank, file, true);
					break;
				case "k":
					this.kingsBoard.setBit(rank, file, true);
					break;
				default:
					error(`Board::setPieceBit(): Unknown piece character: ${pieceChar}!`);
			}
		}

		debugPrint() {
			const labels = ["Pieces", "Color", "Pawns", "Knights", "Bishops", "Rooks", "Queens", "Kings"];

			const bitboards = [
				this.piecesBoard,
				this.colorBoard,
				this.pawnsBoard,
				this.knightsBoard,
				this.bishopsBoard,
				this.rooksBoard,
				this.queensBoard,
				this.kingsBoard,
			];

			// Print each bitboard with a label
			for (let i = 0; i < bitboards.size(); i++) {
				const label = labels[i];
				const bitboard = bitboards[i];
				const matrix = bitboard.toMatrix();

				print(`Bitboard ${label}:`);
				for (const row of matrix) {
					print(row.join(" ")); // Print each row as space-separated values
				}
				print("\n");
			}
		}

		getFen() {
			return this.fen;
		}
	}

	export const create = (fen?: string): Board => {
		return new Board(fen);
	};
}
