// See https://kit.svelte.dev/docs/types#app

import type { Writable } from "svelte/store";

// for information about these interfaces
declare global {
	namespace App {
		/**
		 * Represents a single frame in the animation.
		 */
		type Frame = {
			/**
			 * Whether or not the command stack has been modified since the last image save.
			 */
			dirty: boolean;

			/**
			 * Whether or not the frame is empty (i.e. has no commands)
			 */
			empty: boolean;

			/**
			 * The source of the image to render as an overlay (i.e. source minus bg)
			 */
			overlaySrc: string;

			/**
			 * The final rendered image
			 */
			renderSrc: string;

			/**
			 * The frame render when saved to storage. This may be null if the frame
			 * has not been saved to storage yet.
			 */
			storageSrc: string | null;

			/**
			 * The background color of the frame
			 */
			background: string;

			/**
			 * An array representing a stack of commands to execute when undoing.
			 * Undoing a command pushes the command to the redo stack.
			 */
			undoStack: Command[];

			/**
			 * An array representing a stack of commands that have been moved off of
			 * the undo stack. these commands are not executed themselves; rather, the
			 * redo stack holds them until they are undone or a novel command is
			 * executed that wipes the redo stack.
			 * Redoing a command pushes the command to the undo stack.
			 */
			redoStack: Command[];
		}

		// Holds a function to execute a series of commands, and a series of
		// commands to execute
		type Command = {
			/**
			 * The command type. Mainly used now to short circuit clear commands when
			 * drawing an overlay.
			 */
			type: App.CommandType;
			/**
			 * A list of commands to run when executing this command.
			 */
			commands: { (...args: any[]): void }[];
			/**
			 * A callable function that executes the commands in the command stack.
			 * @param commands The commands to execute
			 * @param args any special args to pass to the commands (typically a
			 * canvas context)
			 */
			execute: (commands: { (...args: any[]): void }[], ...args: any[]) => void;
		}

		/**
		 * TODO: this could be removed by adding discrete layers
		 *
		 * The type of command to execute.
		 *
		 * "draw" commands are not special. they are executed immediately when
		 * regenerating the canvas state.
		 * "clear" commands clear the canvas and fill it with the background color,
		 * unless we are currently drawing an overlay (in which case we only clear
		 * the canvas to a transparent background)
		 */
		type CommandType = "draw" | "clear" ;

		/**
		 * Options for exporting a video via ffmpeg.wasm
		 */
		type ExportOptions = {
			framerate: number;
			size: [number, number];
		}
	}
}

export {};
