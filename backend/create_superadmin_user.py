from database import SessionLocal
from models import User


SUPERADMIN_WALLET = (
    "0xDA53e5780957aA8F63C2715f591828C957a83c49"
)


def main():
    db = SessionLocal()

    try:
        existing = (
            db.query(User)
            .filter(
                User.wallet_address.ilike(
                    SUPERADMIN_WALLET
                )
            )
            .first()
        )

        if existing:
            print(
                "SuperAdmin already exists in PostgreSQL."
            )

            print("ID:", existing.id)
            print("Role:", existing.role)
            print(
                "Wallet:",
                existing.wallet_address
            )

            return

        user = User(
            username=None,
            full_name="EVoTE SuperAdmin",
            email="superadmin@evote.local",
            phone="0000000000",
            password_hash=None,
            role="superadmin",
            wallet_address=SUPERADMIN_WALLET,
            date_of_birth=None,
            profile_picture=None,
            is_active=True,
            is_verified=True,
            register_otp=None,
            register_otp_expires=None,
        )

        db.add(user)
        db.commit()
        db.refresh(user)

        print(
            "======================================"
        )
        print(
            "SUPERADMIN DATABASE USER CREATED"
        )
        print(
            "======================================"
        )

        print("ID:", user.id)
        print("Name:", user.full_name)
        print("Role:", user.role)
        print(
            "Wallet:",
            user.wallet_address
        )

        print(
            "======================================"
        )

    finally:
        db.close()


if __name__ == "__main__":
    main()