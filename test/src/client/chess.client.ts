import { Chess } from "@rbxts/chess";

const board = Chess.Board.create();

board.debugPrint();

const moves = Chess.Movegen.generateLegalMoves(board);

print(`Legal moves: ${moves.size()}`)

for (const move of moves) {
    print(move);
}