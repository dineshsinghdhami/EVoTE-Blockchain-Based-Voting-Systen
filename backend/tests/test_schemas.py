from schemas import UserCreate


def test_user_create_schema():
    user = UserCreate(
        username="john",
        full_name="John Doe",
        email="john@example.com",
        phone="9800000000",
        password="secret123",
        confirm_password="secret123"
    )

    assert user.username == "john"
    assert user.email == "john@example.com"