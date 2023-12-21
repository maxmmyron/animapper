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
			/**
			 * Whether or not the command stack has been modified since the last image save.
			 */
			dirty: boolean;
			/**
			 * Current image src.
			 */
			src: string;
			/**
			 * List of commands to reexec to get to the current state.
			 */
			commands: Command[];
		}

		type Command = {
			execute: () => void;
		}
	}
}

export interface CropTarget {}

export {};
