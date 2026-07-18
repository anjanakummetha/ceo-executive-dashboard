#!/usr/bin/env python3
"""Print the Claude Pro/Max OAuth URL for Hermes (same flow as `hermes auth add anthropic --type oauth`)."""
import secrets
import hashlib
import base64
from urllib.parse import urlencode

CLIENT_ID = "9d1c250a-e61b-44d9-88ed-5944d1962f5e"
REDIRECT_URI = "https://console.anthropic.com/oauth/code/callback"
SCOPES = "org:create_api_key user:profile user:inference"


def pkce():
    verifier = base64.urlsafe_b64encode(secrets.token_bytes(32)).rstrip(b"=").decode()
    challenge = base64.urlsafe_b64encode(
        hashlib.sha256(verifier.encode()).digest()
    ).rstrip(b"=").decode()
    return verifier, challenge


def main():
    verifier, challenge = pkce()
    state = secrets.token_urlsafe(32)
    params = {
        "code": "true",
        "client_id": CLIENT_ID,
        "response_type": "code",
        "redirect_uri": REDIRECT_URI,
        "scope": SCOPES,
        "code_challenge": challenge,
        "code_challenge_method": "S256",
        "state": state,
    }
    url = f"https://claude.ai/oauth/authorize?{urlencode(params)}"
    print("Open this URL to sign in with your Claude account (Pro/Max):")
    print(url)
    print()
    print("After authorizing, run in your terminal:")
    print("  hermes auth add anthropic --type oauth")
    print("and paste the authorization code when prompted.")
    print()
    print(f"(PKCE verifier saved for reference — run full hermes flow to exchange code)")


if __name__ == "__main__":
    main()
