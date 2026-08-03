import re

PASSWORD_POLICY = {
    "min_length": 8,
    "max_length": 128,
    "require_lowercase": True,
    "require_uppercase": True,
    "require_digit": True,
    "require_special": True,
    "reject_common_passwords": True,
    "reject_user_similarity": True,
    "requirements": [
        "Use 8-128 characters.",
        "Include uppercase and lowercase letters.",
        "Include a number and a special character.",
        "Do not use a common password or one similar to your account details.",
    ],
}


def password_policy_errors(password):
    """Evaluate the machine-readable password contract used by API clients."""
    errors = []
    if not PASSWORD_POLICY["min_length"] <= len(password) <= PASSWORD_POLICY["max_length"]:
        errors.append(PASSWORD_POLICY["requirements"][0])
    if PASSWORD_POLICY["require_lowercase"] and not re.search(r"[a-z]", password):
        errors.append("Include a lowercase letter.")
    if PASSWORD_POLICY["require_uppercase"] and not re.search(r"[A-Z]", password):
        errors.append("Include an uppercase letter.")
    if PASSWORD_POLICY["require_digit"] and not re.search(r"\d", password):
        errors.append("Include a number.")
    if PASSWORD_POLICY["require_special"] and not re.search(r"[^A-Za-z0-9]", password):
        errors.append("Include a special character.")
    return errors
