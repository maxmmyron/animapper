// See https://kit.svelte.dev/docs/types#app

import type { Writable } from "svelte/store";

// for information about these interfaces
declare global {
	namespace App {
		type Frame = {
			/**
			 * Whether or not the command stack has been modified since the last image save.
			 */
			dirty: boolean;
			/**
			 * Current image src.
			 */
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

export {};
