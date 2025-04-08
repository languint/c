import { Board } from "./board";
import { Color, Square, Move, Directions } from "./types";

export namespace Movegen {
	export const DIRECTION_OFFSETS = {
		[Directions.NORTH]: [-1, 0],
		[Directions.SOUTH]: [1, 0],
		[Directions.EAST]: [0, 1],
		[Directions.WEST]: [0, -1],
	};

	export const KNIGHT_OFFSETS = [
		[-2, -1],
		[-2, 1],
		[-1, -2],
		[-1, 2],
		[1, -2],
		[1, 2],
		[2, -1],
		[2, 1],
	];

	export const KING_OFFSETS = [
		[-1, -1],
		[-1, 0],
		[-1, 1],
		[0, -1],
		[0, 1],
		[1, -1],
		[1, 0],
		[1, 1],
	];

	export const BISHOP_DIRECTIONS = [
		[-1, -1],
		[-1, 1],
		[1, -1],
		[1, 1],
	];

	export const ROOK_DIRECTIONS = [
		[-1, 0],
		[1, 0],
		[0, -1],
		[0, 1],
	];

	export const QUEEN_DIRECTIONS = [...BISHOP_DIRECTIONS, ...ROOK_DIRECTIONS];

	export function isValidSquare(rank: number, file: number): boolean {
		return rank >= 0 && rank < 8 && file >= 0 && file < 8;
	}

	export function isSquareOccupied(board: Board.Board, rank: number, file: number): boolean {
		return board.piecesBoard.getBit(rank, file);
	}

	export function isSquareOccupiedByColor(board: Board.Board, rank: number, file: number, color: Color): boolean {
		if (!isSquareOccupied(board, rank, file)) return false;

		// For white: board.colorBoard will have 0 at the square
		// For black: board.colorBoard will have 1 at the square
		return board.colorBoard.getBit(rank, file) === (color === Color.BLACK);
	}

	// Generate all pseduo-legal knight moves
	export function generatePawnMoves(board: Board.Board, rank: number, file: number, moves: Move[]): void {
		const color = board.colorBoard.getBit(rank, file) ? Color.BLACK : Color.WHITE;
		const direction = color === Color.WHITE ? -1 : 1; // White moves up (-1 rank), Black moves down (+1 rank)
		const startingRank = color === Color.WHITE ? 6 : 1;

		// Forward move - one square
		if (isValidSquare(rank + direction, file) && !isSquareOccupied(board, rank + direction, file)) {
			moves.push({
				from: { rank, file },
				to: { rank: rank + direction, file },
			});

			// Double forward move from starting position
			if (rank === startingRank && !isSquareOccupied(board, rank + 2 * direction, file)) {
				moves.push({
					from: { rank, file },
					to: { rank: rank + 2 * direction, file },
				});
			}
		}

		// Captures diagonally
		const captureFiles = [file - 1, file + 1];
		for (const captureFile of captureFiles) {
			if (isValidSquare(rank + direction, captureFile)) {
				// Regular capture
				if (
					isSquareOccupied(board, rank + direction, captureFile) &&
					!isSquareOccupiedByColor(board, rank + direction, captureFile, color)
				) {
					moves.push({
						from: { rank, file },
						to: { rank: rank + direction, file: captureFile },
					});
				}
				// TODO: Implement en passant capture when the en passant square info is added
			}
		}

		if (rank + direction === 7 || rank + direction === 0) {
			const promotionPieces = ["knight", "bishop", "rook", "queen"];
			promotionPieces.forEach((piece) => {
				moves.push({
					from: { rank, file },
					to: { rank: rank + direction, file },
					promotionPiece: piece,
				});
			});
		}
	}

	// Generate all pseudo-legal knight moves
	export function generateKnightMoves(board: Board.Board, rank: number, file: number, moves: Move[]): void {
		const color = board.colorBoard.getBit(rank, file) ? Color.BLACK : Color.WHITE;

		for (const [rankOffset, fileOffset] of KNIGHT_OFFSETS) {
			const newRank = rank + rankOffset;
			const newFile = file + fileOffset;

			if (isValidSquare(newRank, newFile) && !isSquareOccupiedByColor(board, newRank, newFile, color)) {
				moves.push({
					from: { rank, file },
					to: { rank: newRank, file: newFile },
				});
			}
		}
	}

	export function generateSlidingMoves(
		board: Board.Board,
		rank: number,
		file: number,
		directions: number[][],
		moves: Move[],
	): void {
		const color = board.colorBoard.getBit(rank, file) ? Color.BLACK : Color.WHITE;

		for (const [rankDir, fileDir] of directions) {
			let newRank = rank + rankDir;
			let newFile = file + fileDir;

			// Continue sliding in direction until hitting board edge or piece
			while (isValidSquare(newRank, newFile)) {
				if (!isSquareOccupied(board, newRank, newFile)) {
					// Empty square - add move and continue sliding
					moves.push({
						from: { rank, file },
						to: { rank: newRank, file: newFile },
					});
				} else {
					// Hit a piece - add capture if enemy and stop sliding
					if (!isSquareOccupiedByColor(board, newRank, newFile, color)) {
						moves.push({
							from: { rank, file },
							to: { rank: newRank, file: newFile },
						});
					}
					break;
				}

				newRank += rankDir;
				newFile += fileDir;
			}
		}
	}

	// Generate all pseudo-legal bishop moves
	export function generateBishopMoves(board: Board.Board, rank: number, file: number, moves: Move[]): void {
		generateSlidingMoves(board, rank, file, BISHOP_DIRECTIONS, moves);
	}

	// Generate all pseudo-legal rook moves
	export function generateRookMoves(board: Board.Board, rank: number, file: number, moves: Move[]): void {
		generateSlidingMoves(board, rank, file, ROOK_DIRECTIONS, moves);
	}

	// Generate all pseudo-legal queen moves
	export function generateQueenMoves(board: Board.Board, rank: number, file: number, moves: Move[]): void {
		generateSlidingMoves(board, rank, file, QUEEN_DIRECTIONS, moves);
	}

	// Generate all pseudo-legal king moves
	export function generateKingMoves(board: Board.Board, rank: number, file: number, moves: Move[]): void {
		const color = board.colorBoard.getBit(rank, file) ? Color.BLACK : Color.WHITE;

		// Normal king moves
		for (const [rankOffset, fileOffset] of KING_OFFSETS) {
			const newRank = rank + rankOffset;
			const newFile = file + fileOffset;

			if (isValidSquare(newRank, newFile) && !isSquareOccupiedByColor(board, newRank, newFile, color)) {
				moves.push({
					from: { rank, file },
					to: { rank: newRank, file: newFile },
				});
			}
		}

		// Castling moves
		generateCastlingMoves(board, rank, file, moves);
	}

	// Generate castling moves for the king
	export function generateCastlingMoves(board: Board.Board, rank: number, file: number, moves: Move[]): void {
		const color = board.colorBoard.getBit(rank, file) ? Color.BLACK : Color.WHITE;
		const castlingRights = board.castlingRights;

		// If King is not on its starting square, we can't castle
		if (
			(color === Color.WHITE && (rank !== 7 || file !== 4)) ||
			(color === Color.BLACK && (rank !== 0 || file !== 4))
		) {
			return;
		}

		// Check if the king is in check - can't castle out of check
		if (isSquareAttacked(board, rank, file, color === Color.WHITE ? Color.BLACK : Color.WHITE)) {
			return;
		}

		// White castling
		if (color === Color.WHITE) {
			// Kingside castling
			if (
				castlingRights.find("K") &&
				!isSquareOccupied(board, 7, 5) &&
				!isSquareOccupied(board, 7, 6) &&
				!isSquareAttacked(board, 7, 5, Color.BLACK) &&
				!isSquareAttacked(board, 7, 6, Color.BLACK)
			) {
				moves.push({
					from: { rank: 7, file: 4 },
					to: { rank: 7, file: 6 },
				});
			}

			// Queenside castling
			if (
				castlingRights.find("Q") &&
				!isSquareOccupied(board, 7, 1) &&
				!isSquareOccupied(board, 7, 2) &&
				!isSquareOccupied(board, 7, 3) &&
				!isSquareAttacked(board, 7, 2, Color.BLACK) &&
				!isSquareAttacked(board, 7, 3, Color.BLACK)
			) {
				moves.push({
					from: { rank: 7, file: 4 },
					to: { rank: 7, file: 2 },
				});
			}
		}
		// Black castling
		else {
			// Kingside castling
			if (
				castlingRights.find("k") &&
				!isSquareOccupied(board, 0, 5) &&
				!isSquareOccupied(board, 0, 6) &&
				!isSquareAttacked(board, 0, 5, Color.WHITE) &&
				!isSquareAttacked(board, 0, 6, Color.WHITE)
			) {
				moves.push({
					from: { rank: 0, file: 4 },
					to: { rank: 0, file: 6 },
				});
			}

			// Queenside castling
			if (
				castlingRights.find("q") &&
				!isSquareOccupied(board, 0, 1) &&
				!isSquareOccupied(board, 0, 2) &&
				!isSquareOccupied(board, 0, 3) &&
				!isSquareAttacked(board, 0, 2, Color.WHITE) &&
				!isSquareAttacked(board, 0, 3, Color.WHITE)
			) {
				moves.push({
					from: { rank: 0, file: 4 },
					to: { rank: 0, file: 2 },
				});
			}
		}
	}

	// Check if a square is under attack by the specified color
	export function isSquareAttacked(board: Board.Board, rank: number, file: number, byColor: Color): boolean {
		// Check pawn attacks
		const pawnDirection = byColor === Color.WHITE ? -1 : 1;
		const pawnAttackFiles = [file - 1, file + 1];

		for (const attackFile of pawnAttackFiles) {
			const attackRank = rank + pawnDirection;
			if (
				isValidSquare(attackRank, attackFile) &&
				board.pawnsBoard.getBit(attackRank, attackFile) &&
				isSquareOccupiedByColor(board, attackRank, attackFile, byColor)
			) {
				return true;
			}
		}

		// Check knight attacks
		for (const [rankOffset, fileOffset] of KNIGHT_OFFSETS) {
			const attackRank = rank + rankOffset;
			const attackFile = file + fileOffset;

			if (
				isValidSquare(attackRank, attackFile) &&
				board.knightsBoard.getBit(attackRank, attackFile) &&
				isSquareOccupiedByColor(board, attackRank, attackFile, byColor)
			) {
				return true;
			}
		}

		// Check king attacks
		for (const [rankOffset, fileOffset] of KING_OFFSETS) {
			const attackRank = rank + rankOffset;
			const attackFile = file + fileOffset;

			if (
				isValidSquare(attackRank, attackFile) &&
				board.kingsBoard.getBit(attackRank, attackFile) &&
				isSquareOccupiedByColor(board, attackRank, attackFile, byColor)
			) {
				return true;
			}
		}

		// Check sliding piece attacks (bishop, rook, queen)

		// Bishop and Queen diagonals
		for (const [rankDir, fileDir] of BISHOP_DIRECTIONS) {
			let attackRank = rank + rankDir;
			let attackFile = file + fileDir;

			while (isValidSquare(attackRank, attackFile)) {
				if (isSquareOccupied(board, attackRank, attackFile)) {
					if (
						isSquareOccupiedByColor(board, attackRank, attackFile, byColor) &&
						(board.bishopsBoard.getBit(attackRank, attackFile) ||
							board.queensBoard.getBit(attackRank, attackFile))
					) {
						return true;
					}
					break; // Hit a piece, stop looking in this direction
				}

				attackRank += rankDir;
				attackFile += fileDir;
			}
		}

		// Rook and Queen horizontals/verticals
		for (const [rankDir, fileDir] of ROOK_DIRECTIONS) {
			let attackRank = rank + rankDir;
			let attackFile = file + fileDir;

			while (isValidSquare(attackRank, attackFile)) {
				if (isSquareOccupied(board, attackRank, attackFile)) {
					if (
						isSquareOccupiedByColor(board, attackRank, attackFile, byColor) &&
						(board.rooksBoard.getBit(attackRank, attackFile) ||
							board.queensBoard.getBit(attackRank, attackFile))
					) {
						return true;
					}
					break; // Hit a piece, stop looking in this direction
				}

				attackRank += rankDir;
				attackFile += fileDir;
			}
		}

		return false;
	}

	// Generate all pseudo-legal moves for a specific piece at the given position
	export function generatePieceMoves(board: Board.Board, rank: number, file: number, moves: Move[]): void {
		if (!isSquareOccupied(board, rank, file)) return;

		if (board.pawnsBoard.getBit(rank, file)) {
			generatePawnMoves(board, rank, file, moves);
		} else if (board.knightsBoard.getBit(rank, file)) {
			generateKnightMoves(board, rank, file, moves);
		} else if (board.bishopsBoard.getBit(rank, file)) {
			generateBishopMoves(board, rank, file, moves);
		} else if (board.rooksBoard.getBit(rank, file)) {
			generateRookMoves(board, rank, file, moves);
		} else if (board.queensBoard.getBit(rank, file)) {
			generateQueenMoves(board, rank, file, moves);
		} else if (board.kingsBoard.getBit(rank, file)) {
			generateKingMoves(board, rank, file, moves);
		}
	}

	// Generate all pseudo-legal moves for a given color
	export function generateMovesForColor(board: Board.Board, color: Color): Move[] {
		const moves: Move[] = [];

		for (let rank = 0; rank < 8; rank++) {
			for (let file = 0; file < 8; file++) {
				if (isSquareOccupied(board, rank, file) && isSquareOccupiedByColor(board, rank, file, color)) {
					generatePieceMoves(board, rank, file, moves);
				}
			}
		}

		return moves;
	}

	// Check if the king of the given color is in check
	export function isKingInCheck(board: Board.Board, color: Color): boolean {
		// Find the king's position
		let kingRank = -1;
		let kingFile = -1;

		for (let rank = 0; rank < 8; rank++) {
			for (let file = 0; file < 8; file++) {
				if (board.kingsBoard.getBit(rank, file) && isSquareOccupiedByColor(board, rank, file, color)) {
					kingRank = rank;
					kingFile = file;
					break;
				}
			}
			if (kingRank !== -1) break;
		}

		if (kingRank === -1) return false; // King not found (shouldn't happen in a valid position)

		// Check if the king is under attack
		return isSquareAttacked(board, kingRank, kingFile, color === Color.WHITE ? Color.BLACK : Color.WHITE);
	}

	// Generate all legal moves for the current position
	export function generateLegalMoves(board: Board.Board): Move[] {
		const color = board.currentMove;
		const pseudoLegalMoves = generateMovesForColor(board, color);
		const legalMoves: Move[] = [];

		// Filter moves that would leave the king in check
		for (const move of pseudoLegalMoves) {
			// Make a hypothetical move
			const boardCopy = makeHypotheticalMove(board, move);

			// If the king is not in check after the move, it's legal
			if (!isKingInCheck(boardCopy, color)) {
				legalMoves.push(move);
			}
		}

		return legalMoves;
	}

	// Create a copy of the board and make a hypothetical move for checking legality
	export function makeHypotheticalMove(board: Board.Board, move: Move): Board.Board {
		// Clone the board
		const newBoard = Board.create(board.getFen());

		// Extract move details
		const { from, to, promotionPiece } = move;

		// Find which piece is moving
		let pieceType = "";
		if (newBoard.pawnsBoard.getBit(from.rank, from.file)) pieceType = "pawn";
		else if (newBoard.knightsBoard.getBit(from.rank, from.file)) pieceType = "knight";
		else if (newBoard.bishopsBoard.getBit(from.rank, from.file)) pieceType = "bishop";
		else if (newBoard.rooksBoard.getBit(from.rank, from.file)) pieceType = "rook";
		else if (newBoard.queensBoard.getBit(from.rank, from.file)) pieceType = "queen";
		else if (newBoard.kingsBoard.getBit(from.rank, from.file)) pieceType = "king";

		// Get the color
		const color = newBoard.colorBoard.getBit(from.rank, from.file) ? Color.BLACK : Color.WHITE;

		// Remove piece from source square
		newBoard.piecesBoard.setBit(from.rank, from.file, false);
		switch (pieceType) {
			case "pawn":
				newBoard.pawnsBoard.setBit(from.rank, from.file, false);
				break;
			case "knight":
				newBoard.knightsBoard.setBit(from.rank, from.file, false);
				break;
			case "bishop":
				newBoard.bishopsBoard.setBit(from.rank, from.file, false);
				break;
			case "rook":
				newBoard.rooksBoard.setBit(from.rank, from.file, false);
				break;
			case "queen":
				newBoard.queensBoard.setBit(from.rank, from.file, false);
				break;
			case "king":
				newBoard.kingsBoard.setBit(from.rank, from.file, false);
				break;
		}

		// Remove any captured piece at destination
		if (newBoard.piecesBoard.getBit(to.rank, to.file)) {
			if (newBoard.pawnsBoard.getBit(to.rank, to.file)) newBoard.pawnsBoard.setBit(to.rank, to.file, false);
			if (newBoard.knightsBoard.getBit(to.rank, to.file)) newBoard.knightsBoard.setBit(to.rank, to.file, false);
			if (newBoard.bishopsBoard.getBit(to.rank, to.file)) newBoard.bishopsBoard.setBit(to.rank, to.file, false);
			if (newBoard.rooksBoard.getBit(to.rank, to.file)) newBoard.rooksBoard.setBit(to.rank, to.file, false);
			if (newBoard.queensBoard.getBit(to.rank, to.file)) newBoard.queensBoard.setBit(to.rank, to.file, false);
			if (newBoard.kingsBoard.getBit(to.rank, to.file)) newBoard.kingsBoard.setBit(to.rank, to.file, false);
		}

		// Place the piece on the destination square
		newBoard.piecesBoard.setBit(to.rank, to.file, true);
		newBoard.colorBoard.setBit(to.rank, to.file, color === Color.BLACK);
		switch (pieceType) {
			case "knight":
				newBoard.knightsBoard.setBit(to.rank, to.file, true);
				break;
			case "bishop":
				newBoard.bishopsBoard.setBit(to.rank, to.file, true);
				break;
			case "rook":
				newBoard.rooksBoard.setBit(to.rank, to.file, true);
				break;
			case "queen":
				newBoard.queensBoard.setBit(to.rank, to.file, true);
				break;
		}

		// Handle special moves like castling
		if (pieceType === "king" && math.abs(from.file - to.file) === 2) {
			// This is a castling move
			const isKingside = to.file > from.file;
			const rookFromFile = isKingside ? 7 : 0;
			const rookToFile = isKingside ? 5 : 3;

			// Move the rook
			newBoard.piecesBoard.setBit(from.rank, rookFromFile, false);
			newBoard.rooksBoard.setBit(from.rank, rookFromFile, false);

			newBoard.piecesBoard.setBit(from.rank, rookToFile, true);
			newBoard.colorBoard.setBit(from.rank, rookToFile, color === Color.BLACK);
			newBoard.rooksBoard.setBit(from.rank, rookToFile, true);
		}

		//!TODO: Handle en passant

		if (promotionPiece) {
			newBoard.piecesBoard.setBit(from.rank, from.file, false);
			newBoard.colorBoard.setBit(from.rank, from.file, false); // Doesn't matter since there is no piece there.
			newBoard.colorBoard.setBit(to.file, to.rank, color === Color.BLACK);
			switch (promotionPiece) {
				case "pawn":
					newBoard.pawnsBoard.setBit(to.rank, to.file, true);
					break;
				case "knight":
					newBoard.knightsBoard.setBit(to.rank, to.file, true);
					break;
				case "bishop":
					newBoard.bishopsBoard.setBit(to.rank, to.file, true);
					break;
				case "rook":
					newBoard.rooksBoard.setBit(to.rank, to.file, true);
					break;
				case "queen":
					newBoard.queensBoard.setBit(to.rank, to.file, true);
					break;
				case "king":
					newBoard.kingsBoard.setBit(to.rank, to.file, true);
					break;
			}
		}

		return newBoard;
	}

	/**
	 * Get a list of all squares controlled by a specific color
	 */
	export function getControlledSquaresForColor(board: Board.Board, color: Color): Square[] {
		const controlledSquares: Square[] = [];

		for (let rank = 0; rank < 8; rank++) {
			for (let file = 0; file < 8; file++) {
				if (isSquareAttacked(board, rank, file, color)) {
					controlledSquares.push({ rank, file });
				}
			}
		}

		return controlledSquares;
	}
}
