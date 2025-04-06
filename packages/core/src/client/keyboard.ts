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
		private built: boolean = false; // Has build() been called.

		/**
		 * Register a new key-combo callback pair.
		 * @param key The key-combo to trigger the function
		 * @param callbacks Functions to hook into the key combo
		 * @param event InputBegan, InputChanged, or InputEnded.
		 * @param once Should the callbacks only happen once?
		 * @returns
		 */
		register(
			key: CombinedInput,
			callbacks: KeycodeCallback | KeycodeCallback[],
			event?: InputEvent,
			once?: boolean,
		): Keyboard {
			callbacks = (typeIs(callbacks, "table") ? callbacks : [callbacks]) as KeycodeCallback[];

			// Warn the user about any improper usage, and exit.
			if (containsMouseInput(key)) {
				warn(`Keyboard::register(): You cannot use mouse events in Keyboards!`);
				return this;
			}

			if (this.built) {
				this.cleanUp(); // Reset
				this.built = false;
			}

			const additional = {
				callbacks: callbacks,
				event: event !== undefined ? event : "Began",
				once: once !== undefined ? once : false,
			};

			const existingListeners = this.listeners.get(key);

			existingListeners
				? this.listeners.set(key, [...existingListeners, additional] as KeycodeListener[])
				: this.listeners.set(key, [additional]);

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

		/**
		 * Build the keyboard
		 * 🔺 **Subsequent calls to register() will reset the registered callbacks.** 🔺
		 */
		build(): void {
			this.listeners.forEach((listeners, key) => {
				listeners.forEach((listener) => {
					this.connections.set(key, this.connect(listener.callbacks, listener.event, listener.once, key));
				});
			});
			this.built = true;
		}

		getConnections() {
			return this.connections;
		}

		/**
		 * Disconnects the given key-combo's listeners.
		 * @param key The key-combo to disconnect
		 * @returns
		 */
		disconnect(key: CombinedInput) {
			const connections = this.connections.get(key);
			if (!connections) return;
			connections.forEach((c) => c.Disconnect());
		}

		/**
		 * Cleans up the instance by clearing the registry.
		 */
		cleanUp() {
			this.connections.forEach((c, k) => this.disconnect(k));
			this.connections.clear();
			this.doneListeners.clear();
			this.listeners.clear();
		}
	}

	export const useKeyboard = (): Keyboard => {
		return new Keyboard();
	};
}
