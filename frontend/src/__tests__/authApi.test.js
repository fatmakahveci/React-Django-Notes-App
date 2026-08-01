import axios from "axios";
import { createAuthApi } from "../api/authApi";

const { handlers, instance } = vi.hoisted(() => ({
	handlers: {},
	instance: vi.fn((config) => Promise.resolve({ replayed: config })),
}));

vi.mock("axios", () => ({
	default: {
		create: vi.fn(() => instance),
		post: vi.fn(),
	},
}));

beforeEach(() => {
	vi.clearAllMocks();
	Object.assign(handlers, {
		requestSuccess: null,
		requestError: null,
		responseSuccess: null,
		responseError: null,
	});
	instance.interceptors = {
		request: {
			use: vi.fn((success, error) => {
				handlers.requestSuccess = success;
				handlers.requestError = error;
			}),
		},
		response: {
			use: vi.fn((success, error) => {
				handlers.responseSuccess = success;
				handlers.responseError = error;
			}),
		},
	};
});

test("refreshes once and replays a rejected request", async () => {
	const setAuthTokens = vi.fn();
	axios.post.mockResolvedValue({ data: { authenticated: true } });
	createAuthApi({
		setAuthTokens,
		logoutUser: vi.fn(),
	});
	const originalRequest = { headers: {} };

	await handlers.responseError({
		config: originalRequest,
		response: { status: 401 },
	});

	expect(axios.post).toHaveBeenCalledWith(
		expect.stringMatching(/\/api\/accounts\/token\/refresh\/$/),
		{},
		expect.objectContaining({ withCredentials: true }),
	);
	expect(setAuthTokens).toHaveBeenCalledWith({ access: true });
	expect(instance).toHaveBeenCalledWith(originalRequest);
});

test("logs out instead of retrying forever", async () => {
	const logoutUser = vi.fn();
	createAuthApi({ logoutUser });
	const error = {
		config: { _retry: true },
		response: { status: 401 },
	};

	await expect(handlers.responseError(error)).rejects.toBe(error);
	expect(logoutUser).toHaveBeenCalledOnce();
	expect(axios.post).not.toHaveBeenCalled();
});

test("does not refresh non-authentication failures", async () => {
	createAuthApi({});
	const error = { config: {}, response: { status: 500 } };

	await expect(handlers.responseError(error)).rejects.toBe(error);
	expect(axios.post).not.toHaveBeenCalled();
});
