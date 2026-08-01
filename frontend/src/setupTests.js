import "@testing-library/jest-dom";

const storage = (() => {
	let values = {};
	return {
		getItem: (key) => values[key] ?? null,
		setItem: (key, value) => {
			values[key] = String(value);
		},
		removeItem: (key) => {
			delete values[key];
		},
		clear: () => {
			values = {};
		},
	};
})();

Object.defineProperty(globalThis, "localStorage", {
	value: storage,
	configurable: true,
});
