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
		coverage: {
			provider: "v8",
			reporter: ["text", "html", "lcov"],
			include: ["src/**/*.{js,jsx}"],
			exclude: ["src/**/*.test.{js,jsx}", "src/__tests__/**", "src/__mocks__/**", "src/index.jsx", "src/testRouter.jsx"],
			thresholds: {
				statements: 75,
				branches: 70,
				functions: 65,
				lines: 75,
			},
		},
	},
});
