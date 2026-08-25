from database import engine
from models import Base


def main():
    print("======================================")
    print("EVOTE WALLET NONCE TABLE")
    print("======================================")

    Base.metadata.create_all(
        bind=engine
    )

    print(
        "wallet_nonces table is ready."
    )

    print("======================================")


if __name__ == "__main__":
    main()