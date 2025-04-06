import { UserInputService } from "@rbxts/services";
import { CombinedInput, Keycode, MouseInput } from "../types";
import { containsMouseInput } from "../utils";

export namespace Keyboard {
	type KeycodeCallback = (input: InputObject, processed: boolean) => void;
	type InputEvent = "Began" | "Ended" | "Changed";

	interface KeycodeListener {
		callbacks: KeycodeCallback[];
		event: InputEvent;
		once: boolean;
	}

	export class Keyboard {
		private listeners: Map<CombinedInput, KeycodeListener[]> = new Map();
		private connections: Map<CombinedInput, RBXScriptConnection[]> = new Map();
		private doneListeners: Map<CombinedInput, boolean> = new Map();

		register(
			key: CombinedInput,
			callbacks: KeycodeCallback | KeycodeCallback[],
			event?: InputEvent,
			once?: boolean,
		): Keyboard {
			callbacks = (typeIs(callbacks, "table") ? callbacks : [callbacks]) as KeycodeCallback[];

			// Warn the user about any improper usage, and exit.
			if (containsMouseInput(key)) {
				warn(`Keyboard::register() You cannot use mouse events in Keyboards!`);
				return this;
			}

			const existingListeners = this.listeners.get(key);
			if (existingListeners) {
				const combinedListeners = [
					...existingListeners,
					{
						callbacks: callbacks,
						event: event !== undefined ? event : "Began",
						once: once !== undefined ? once : false,
					},
				] as KeycodeListener[];

				this.listeners.set(key, combinedListeners);
			} else {
				this.listeners.set(key, [
					{
						callbacks: callbacks,
						event: event !== undefined ? event : "Began",
						once: once !== undefined ? once : false,
					},
				]);
			}

			return this;
		}

		private connect(
			callbacks: KeycodeCallback[],
			event: InputEvent,
			once: boolean,
			key: CombinedInput,
		): RBXScriptConnection[] {
			const connectEvent = () => {
				switch (event) {
					case "Began":
						return UserInputService.InputBegan;
					case "Ended":
						return UserInputService.InputEnded;
					case "Changed":
						return UserInputService.InputChanged;
					default:
						return undefined;
				}
			};

			const eventConnection = connectEvent();
			if (!eventConnection) {
				warn(`Invalid event type: ${event}`);
				return [];
			}

			const connections: RBXScriptConnection[] = [];

			callbacks.forEach((callback) => {
				const callbackFiltered = (input: InputObject, processed: boolean) => {
					const inputs = typeIs(key, "table") ? (key as (Keycode | MouseInput)[]) : [key];

					if (this.doneListeners.get(key) === true && once) {
						this.disconnect(key);
						this.listeners.delete(key);
						this.doneListeners.delete(key);
						this.connections.delete(key);
						return;
					}

					// Check if all keys in the inputs array are held
					for (const inputKey of inputs) {
						const held = UserInputService.IsKeyDown(inputKey as Keycode);

						if (!held) return;
					}

					callback(input, processed);
					this.doneListeners.set(key, true);
				};

				const connection = eventConnection.Connect(callbackFiltered);

				if (connection) {
					connections.push(connection);
				}

			});

			return connections;
		}

		build(): void {
			this.listeners.forEach((listeners, key) => {
				listeners.forEach((listener) => {
					this.connections.set(key, this.connect(listener.callbacks, listener.event, listener.once, key));
				});
			});
		}

		getConnections() {
			return this.connections;
		}

		disconnect(key: CombinedInput) {
			const connections = this.connections.get(key);
			if (!connections) return;
			connections.forEach((c) => c.Disconnect());
		}
	}

	export const useKeyboard = (): Keyboard => {
		return new Keyboard();
	};
}
