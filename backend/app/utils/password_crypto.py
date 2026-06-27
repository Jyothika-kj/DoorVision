from cryptography.fernet import Fernet, InvalidToken

from app.config import settings


fernet = Fernet(settings.CAMERA_SECRET_KEY.encode())


def encrypt_text(value: str | None) -> str | None:
    if value is None:
        return None

    value = value.strip()

    if not value:
        return None

    return fernet.encrypt(value.encode()).decode()


def decrypt_text(value: str | None) -> str | None:
    if value is None:
        return None

    value = value.strip()

    if not value:
        return None

    try:
        return fernet.decrypt(value.encode()).decode()
    except InvalidToken:
        # This protects old plain-text passwords during development.
        return value