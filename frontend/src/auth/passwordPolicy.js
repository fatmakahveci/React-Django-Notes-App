export function passwordMeetsPolicy(password, policy) {
	if (!policy) return false;
	if (password.length < policy.min_length || password.length > policy.max_length) return false;
	if (policy.require_lowercase && !/[a-z]/.test(password)) return false;
	if (policy.require_uppercase && !/[A-Z]/.test(password)) return false;
	if (policy.require_digit && !/\d/.test(password)) return false;
	if (policy.require_special && !/[^A-Za-z0-9]/.test(password)) return false;
	return true;
}
