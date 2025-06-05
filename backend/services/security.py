from cryptography.fernet import Fernet
import hashlib
import base64

def derive_key_from_pin(pin: str) -> bytes:
    # Example: use SHA256 of PIN to derive a 32-byte key then base64 encode
    h = hashlib.sha256(pin.encode()).digest()
    return Fernet.generate_key() if not pin else base64.urlsafe_b64encode(h)
