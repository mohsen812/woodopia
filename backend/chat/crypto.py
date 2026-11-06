import base64
import os
import secrets

from cryptography.exceptions import InvalidTag
from cryptography.hazmat.primitives.ciphers.aead import AESGCM


CURRENT_KEY_VERSION = 1
NONCE_SIZE = 12
KEY_SIZE = 32


class ChatEncryptionError(Exception):
    pass


def _get_encryption_key(version):
    if not isinstance(version, int) or version < 1:
        raise ChatEncryptionError("Invalid encryption key version.")

    variable_name = "FEEMAAS_CHAT_ENCRYPTION_KEY_V{}".format(version)
    encoded_key = os.environ.get(variable_name)

    if not encoded_key:
        raise ChatEncryptionError(
            "Chat encryption key version {} is not configured.".format(version)
        )

    try:
        padded_key = encoded_key + ("=" * (-len(encoded_key) % 4))
        key = base64.b64decode(
            padded_key,
            altchars=b"-_",
            validate=True,
        )
    except Exception:
        raise ChatEncryptionError(
            "Chat encryption key version {} is not valid Base64.".format(version)
        )

    if len(key) != KEY_SIZE:
        raise ChatEncryptionError(
            "Chat encryption key version {} must decode to exactly 32 bytes.".format(version)
        )

    return key


def encrypt_message(plaintext, associated_data):
    if not isinstance(plaintext, str):
        raise TypeError("Message plaintext must be a string.")

    if not isinstance(associated_data, bytes):
        raise TypeError("Associated data must be bytes.")

    key = _get_encryption_key(CURRENT_KEY_VERSION)
    nonce = secrets.token_bytes(NONCE_SIZE)

    ciphertext = AESGCM(key).encrypt(
        nonce,
        plaintext.encode("utf-8"),
        associated_data,
    )

    return {
        "ciphertext": ciphertext,
        "nonce": nonce,
        "key_version": CURRENT_KEY_VERSION,
    }


def decrypt_message(ciphertext, nonce, key_version, associated_data):
    if not isinstance(associated_data, bytes):
        raise TypeError("Associated data must be bytes.")

    if len(nonce) != NONCE_SIZE:
        raise ChatEncryptionError("Invalid AES-GCM nonce length.")

    key = _get_encryption_key(key_version)

    try:
        plaintext = AESGCM(key).decrypt(
            bytes(nonce),
            bytes(ciphertext),
            associated_data,
        )
        return plaintext.decode("utf-8")
    except InvalidTag:
        raise ChatEncryptionError(
            "Message authentication failed; ciphertext or associated data is invalid."
        )
    except UnicodeDecodeError:
        raise ChatEncryptionError("Decrypted message is not valid UTF-8.")
