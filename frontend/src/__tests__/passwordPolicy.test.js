import { passwordMeetsPolicy } from "../auth/passwordPolicy";

const policy = {
	min_length: 8,
	max_length: 128,
	require_lowercase: true,
	require_uppercase: true,
	require_digit: true,
	require_special: true,
	reject_common_passwords: true,
	reject_user_similarity: true,
};

test("interprets the backend password policy contract", () => {
	expect(passwordMeetsPolicy("StrongPass1!", policy)).toBe(true);
	expect(passwordMeetsPolicy("lowercase1!", policy)).toBe(false);
	expect(passwordMeetsPolicy("UPPERCASE1!", policy)).toBe(false);
	expect(passwordMeetsPolicy("NoNumber!", policy)).toBe(false);
	expect(passwordMeetsPolicy("NoSpecial1", policy)).toBe(false);
	expect(passwordMeetsPolicy("Short1!", policy)).toBe(false);
});
