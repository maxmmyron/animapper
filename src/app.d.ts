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
			 * The source of the image to render as an overlay (i.e. source minus bg)
			 */
			overlaySrc: string;
			/**
			 * The final rendered image
			 */
			renderSrc: string;

			/**
			 * The background color of the frame
			 */
			background: string;
			undoStack: Command[];
			redoStack: Command[];
		}

		// Holds a function to execute a series of commands, and a series of
		// commands to execute
		type Command = {
			type: App.CommandType;
			// A list of commands that can be executed. Each command is a function.
			commands: { (...args: any[]): void }[];
			execute: (commands: { (...args: any[]): void }[], ...args: any[]) => void;
		}

		type CommandType = "draw" | "clear" ;

		type ExportOptions = {
			framerate: number;
		}
	}
}

export {};
