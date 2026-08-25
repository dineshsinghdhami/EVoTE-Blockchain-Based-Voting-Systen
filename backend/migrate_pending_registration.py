from database import engine
from models import Base


def main():
    print("======================================")
    print("EVOTE PENDING REGISTRATION TABLE")
    print("======================================")

    Base.metadata.create_all(
        bind=engine
    )

    print(
        "pending_wallet_registrations table is ready."
    )

    print("======================================")


if __name__ == "__main__":
    main()