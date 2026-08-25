from sqlalchemy import text
from database import engine


def main():
    print("======================================")
    print("EVOTE USER TABLE MIGRATION")
    print("======================================")

    with engine.begin() as connection:

        # --------------------------------------------------
        # 1. ADD DATE OF BIRTH
        # --------------------------------------------------

        connection.execute(
            text("""
                ALTER TABLE users
                ADD COLUMN IF NOT EXISTS date_of_birth DATE;
            """)
        )

        print("date_of_birth column ready.")

        # --------------------------------------------------
        # 2. ADD ACTIVE STATUS
        # --------------------------------------------------

        connection.execute(
            text("""
                ALTER TABLE users
                ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
            """)
        )

        connection.execute(
            text("""
                UPDATE users
                SET is_active = TRUE
                WHERE is_active IS NULL;
            """)
        )

        print("is_active column ready.")

        # --------------------------------------------------
        # 3. CHECK DUPLICATE WALLET ADDRESSES
        # --------------------------------------------------

        duplicate_wallets = connection.execute(
            text("""
                SELECT LOWER(wallet_address), COUNT(*)
                FROM users
                WHERE wallet_address IS NOT NULL
                  AND wallet_address <> ''
                GROUP BY LOWER(wallet_address)
                HAVING COUNT(*) > 1;
            """)
        ).fetchall()

        if duplicate_wallets:
            print("")
            print("WARNING:")
            print("Duplicate wallet addresses were found.")
            print("Unique wallet protection was NOT added.")

            for wallet, count in duplicate_wallets:
                print(
                    f"{wallet} appears {count} times"
                )

            print("")
            print(
                "Tell ChatGPT about this result "
                "before continuing."
            )

        else:
            # ----------------------------------------------
            # 4. ADD UNIQUE WALLET INDEX
            # ----------------------------------------------

            connection.execute(
                text("""
                    CREATE UNIQUE INDEX IF NOT EXISTS
                    ix_users_wallet_address_unique
                    ON users (LOWER(wallet_address))
                    WHERE wallet_address IS NOT NULL
                      AND wallet_address <> '';
                """)
            )

            print(
                "Unique wallet-address protection ready."
            )

    print("")
    print("======================================")
    print("MIGRATION COMPLETED")
    print("======================================")


if __name__ == "__main__":
    main()