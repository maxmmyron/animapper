import { sveltekit } from '@sveltejs/kit/vite';
import cesium from "vite-plugin-cesium";
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit(), cesium()],
});
