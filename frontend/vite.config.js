import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";

export default defineConfig({
	// SVGR preserves the existing pattern of importing SVG files as React components.
	plugins: [react(), svgr()],
	test: {
		environment: "jsdom",
		globals: true,
		setupFiles: "./src/setupTests.js",
	},
});
