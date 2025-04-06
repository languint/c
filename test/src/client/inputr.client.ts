import { Inputr, Keycodes, MouseInput } from "@rbxts/inputr";

const keyboard = Inputr.Client.Keyboard.useKeyboard();

keyboard
	.register(
		[Keycodes.A, Keycodes.B],
		() => {
			print("Hello from Inputr!");
		},
		"Began",
		false,
	)
	.register([Keycodes.N], () => {
		print("N was pressed")
	}, "Began", true)
	.register([Keycodes.C], () => {
		print("Hello2");
	})
	.build();
