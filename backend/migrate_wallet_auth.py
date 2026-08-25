from sqlalchemy import text
from database import engine


def main():
    print("======================================")
    print("EVOTE WALLET AUTH MIGRATION")
    print("======================================")

    with engine.begin() as connection:

        connection.execute(
            text("""
                ALTER TABLE users
                ALTER COLUMN username
                DROP NOT NULL;
            """)
        )

        print("username is now optional.")

        connection.execute(
            text("""
                ALTER TABLE users
                ALTER COLUMN password_hash
                DROP NOT NULL;
            """)
        )

        print("password_hash is now optional.")

    print("")
    print("======================================")
    print("MIGRATION COMPLETED")
    print("======================================")


if __name__ == "__main__":
    main()