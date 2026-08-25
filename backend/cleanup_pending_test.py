from database import SessionLocal
from models import PendingWalletRegistration


OLD_WALLET = "0xDA53e5780957aA8F63C2715f591828C957a83c49"


def main():
    db = SessionLocal()

    try:
        pending = (
            db.query(PendingWalletRegistration)
            .filter(
                PendingWalletRegistration.wallet_address
                == OLD_WALLET.lower()
            )
            .first()
        )

        if pending:
            db.delete(pending)
            db.commit()

            print("======================================")
            print("OLD TEST REGISTRATION REMOVED")
            print("======================================")
            print("Wallet:", OLD_WALLET)
            print("Only pending registration was deleted.")
            print("No blockchain data was changed.")
            print("======================================")

        else:
            print("======================================")
            print("NO OLD PENDING REGISTRATION FOUND")
            print("======================================")

    finally:
        db.close()


if __name__ == "__main__":
    main()