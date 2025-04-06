// Type aliases
export type Keycode = Enum.KeyCode;
export const Keycodes = Enum.KeyCode;

export const MouseInput = {
	LeftClick: Enum.UserInputType.MouseButton1,
	RightClick: Enum.UserInputType.MouseButton2,
	MiddleClick: Enum.UserInputType.MouseButton3,
	Movement: Enum.UserInputType.MouseMovement,
	Scroll: Enum.UserInputType.MouseWheel,
} as const;

export type MouseInput = (typeof MouseInput)[keyof typeof MouseInput];

export type CombinedInput = (Keycode | MouseInput) | (Keycode | MouseInput)[];
