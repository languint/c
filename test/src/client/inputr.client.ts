import { Inputr, Keycodes } from "@rbxts/inputr";

const keyboard = Inputr.Client.Keyboard.useKeyboard();

keyboard
	.register(
		Keycodes.A,
		() => {
			print("Hello from Inputr!");
		},
		"Began",
		false,
	)
	.build();
