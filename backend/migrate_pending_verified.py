from sqlalchemy import text
from database import engine


def main():
    print("======================================")
    print("EVOTE EMAIL VERIFICATION MIGRATION")
    print("======================================")

    with engine.begin() as connection:
        connection.execute(
            text("""
                ALTER TABLE pending_wallet_registrations
                ADD COLUMN IF NOT EXISTS
                email_verified BOOLEAN DEFAULT FALSE;
            """)
        )

        connection.execute(
            text("""
                UPDATE pending_wallet_registrations
                SET email_verified = FALSE
                WHERE email_verified IS NULL;
            """)
        )

    print("email_verified column ready.")
    print("======================================")
    print("MIGRATION COMPLETED")
    print("======================================")


if __name__ == "__main__":
    main()