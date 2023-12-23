// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
		type Frame = {
			layers: Layer[];
		}

		type Layer = {
			/**
			 * Whether or not the layer's command stack has been modified since the last image save.
			 */
			isDirty: boolean;

			/**
			 * Whether or not the layer is visible.
			 */
			isVisible: boolean;

			src: string;

			undoStack: Command[];
			redoStack: Command[];
		}

		// Holds a function to execute a series of commands, and a series of
		// commands to execute
		type Command = {
			// A list of commands that can be executed. Each command is a function.
			commands: { (...args: any[]): void }[];
			execute: (commands: { (...args: any[]): void }[], ...args: any[]) => void;
		}
	}
}

export interface CropTarget {}

export {};
