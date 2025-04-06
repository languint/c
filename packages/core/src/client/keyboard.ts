import { UserInputService } from "@rbxts/services";
import { Keycode } from "../types";

export namespace Keyboard {
	type KeycodeCallback = (input: InputObject, processed: boolean) => void;
	type InputEvent = "Began" | "Ended" | "Changed";

	interface KeycodeListener {
		callbacks: KeycodeCallback[];
		event: InputEvent;
		once: boolean;
	}

	export class Keyboard {
		private listeners: Map<Keycode, KeycodeListener[]> = new Map();
		private connections: Map<Keycode, RBXScriptConnection[]> = new Map();

		register(
			key: Keycode,
			callbacks: KeycodeCallback | KeycodeCallback[],
			event?: InputEvent,
			once?: boolean,
		): Keyboard {
			callbacks = (typeIs(callbacks, "table") ? callbacks : [callbacks]) as KeycodeCallback[];

			const existingListeners = this.listeners.get(key);
			if (existingListeners) {
				const combinedListeners = [
					...existingListeners,
					{
						callbacks: callbacks,
						event: event ?? "Began",
						once: once ?? false,
					},
				] as KeycodeListener[];

				this.listeners.set(key, combinedListeners);
			} else {
				this.listeners.set(key, [
					{
						callbacks: callbacks,
						event: event ?? "Began",
						once: once ?? false,
					},
				]);
			}

			return this;
		}

		private connect(
			callbacks: KeycodeCallback[],
			event: InputEvent,
			once: boolean,
			key: Keycode,
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
						break;
				}
			};

			const eventConnection = connectEvent();
			const connections: RBXScriptConnection[] = [];

			callbacks.forEach((callback) => {
				const callbackFiltered = (input: InputObject, processed: boolean) => {
					if (input.KeyCode === key) callback(input, processed);
				};
				switch (once) {
					case true:
						connections.push(eventConnection?.Once(callbackFiltered)!);
					default:
						connections.push(eventConnection?.Connect(callbackFiltered)!);
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

		disconnect(key: Keycode) {
			const connections = this.connections.get(key);
			if (!connections) return;
			connections.forEach((c) => c.Disconnect());
		}
	}

	export const useKeyboard = (): Keyboard => {
		return new Keyboard();
	};
}
