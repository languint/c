import { CombinedInput, MouseInput } from "./types";

export function keyCodeIsMouseEvent(key: Enum.KeyCode | MouseInput) {
	return (
		key === Enum.UserInputType.MouseButton1 ||
		key === Enum.UserInputType.MouseButton2 ||
		key === Enum.UserInputType.MouseButton3 ||
		key === Enum.UserInputType.MouseMovement ||
		key === Enum.UserInputType.MouseWheel
	);
}

export function containsMouseInput(input: CombinedInput): boolean {
	if (typeIs(input, "table")) {
		// If input is an array, check if any element is a mouse input
		return (input as (Enum.KeyCode | MouseInput)[]).some(keyCodeIsMouseEvent);
	} else {
		// If input is a single value, check if it's a mouse input
		return keyCodeIsMouseEvent(input);
	}
}

export function containsKeyboardInput(input: CombinedInput): boolean {
	if (typeIs(input, "table")) {
		// If input is an array, check if any element is a mouse input
		return (input as (Enum.KeyCode | MouseInput)[]).some((k) => !keyCodeIsMouseEvent(k));
	} else {
		// If input is a single value, check if it's a mouse input
		return !keyCodeIsMouseEvent(input);
	}
}
