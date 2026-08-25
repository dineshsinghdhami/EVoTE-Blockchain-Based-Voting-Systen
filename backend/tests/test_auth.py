from auth import (
    hash_password,
    verify_password,
    create_access_token
)


def test_hash_password():
    password = "mypassword123"

    hashed = hash_password(password)

    assert hashed != password
    assert isinstance(hashed, str)


def test_verify_password_success():
    password = "mypassword123"

    hashed = hash_password(password)

    assert verify_password(password, hashed) is True


def test_verify_password_failure():
    password = "mypassword123"

    hashed = hash_password(password)

    assert verify_password("wrongpassword", hashed) is False


def test_create_access_token():
    token = create_access_token(
        {"sub": "test@example.com"}
    )

    assert token is not None
    assert isinstance(token, str)