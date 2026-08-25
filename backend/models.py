from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Date
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(
    String,
    unique=True,
    index=True,
    nullable=True
)
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    phone = Column(String, unique=True, nullable=False)
    password_hash = Column(
    String,
    nullable=True
)
    role = Column(String, default="voter")
    wallet_address = Column(
    String,
    unique=True,
    index=True,
    nullable=True
    )

    date_of_birth = Column(
        Date,
        nullable=True
    )

    profile_picture = Column(
        String,
        nullable=True
    )

    is_active = Column(
        Boolean,
        default=True
    )
    is_verified = Column(Boolean, default=False)
    register_otp = Column(String, nullable=True)
    register_otp_expires = Column(DateTime, nullable=True)
    reset_otp = Column(String, nullable=True)
    reset_otp_expires = Column(DateTime, nullable=True)

class CandidateRequest(Base):
    __tablename__ = "candidate_requests"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    institution_id = Column(
        Integer,
        nullable=True
    )

    organization_id = Column(
        Integer,
        nullable=True
    )

    # This is the blockchain Post ID.
    # We keep the old column name so we do not
    # break all existing code at once.
    election_id = Column(
        Integer,
        nullable=False
    )

    status = Column(
        String,
        default="pending"
    )


class VoteRecord(Base):
    __tablename__ = "vote_records"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    institution_id = Column(Integer, nullable=False)
    election_id = Column(Integer, nullable=False)
    candidate_id = Column(Integer, nullable=False)
    tx_hash = Column(String, nullable=False)


class TransactionHistory(Base):
    __tablename__ = "transaction_history"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(Integer, nullable=True)
    full_name = Column(String, nullable=False)
    email = Column(String, nullable=False)
    role = Column(String, nullable=False)

    action = Column(String, nullable=False)  
    tx_hash = Column(String, nullable=False)
    from_address = Column(String, nullable=True)
    status = Column(String, nullable=False)

    created_at = Column(
    DateTime(timezone=True),
    nullable=True
)  

class CandidateProfile(Base):
    __tablename__ = "candidate_profiles"

    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, nullable=False)
    election_id = Column(Integer, nullable=False)
    candidate_id = Column(Integer, nullable=False)

    name = Column(String, nullable=False)
    department = Column(String, nullable=True)
    semester = Column(String, nullable=True)
    bio = Column(String, nullable=True)
    agenda = Column(String, nullable=True)
    photo = Column(String, nullable=True)    


class WalletNonce(Base):
    __tablename__ = "wallet_nonces"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    wallet_address = Column(
        String,
        unique=True,
        index=True,
        nullable=False
    )

    nonce = Column(
        String,
        nullable=False
    )

    expires_at = Column(
        DateTime,
        nullable=False
    )


class PendingWalletRegistration(Base):

    __tablename__ = "pending_wallet_registrations"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    wallet_address = Column(
        String,
        unique=True,
        index=True,
        nullable=False
    )

    full_name = Column(
        String,
        nullable=False
    )

    email = Column(
        String,
        unique=True,
        index=True,
        nullable=False
    )

    phone = Column(
        String,
        nullable=False
    )

    date_of_birth = Column(
        Date,
        nullable=False
    )

    otp = Column(
        String,
        nullable=False
    )

    otp_expires = Column(
        DateTime,
        nullable=False
    )
    email_verified = Column(
    Boolean,
    default=False
    )


class ElectionNotification(Base):
    __tablename__ = "election_notifications"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    institution_id = Column(
        Integer,
        nullable=False
    )

    organization_id = Column(
        Integer,
        nullable=False
    )

    title = Column(
        String,
        nullable=False
    )

    min_candidate_age = Column(
        Integer,
        nullable=False
    )

    max_candidate_age = Column(
        Integer,
        nullable=False
    )

    candidate_registration_start = Column(
        Integer,
        nullable=False
    )

    candidate_registration_end = Column(
        Integer,
        nullable=False
    )

    voting_start = Column(
        Integer,
        nullable=False
    )

    voting_end = Column(
        Integer,
        nullable=False
    )

    candidate_email_sent = Column(
        Boolean,
        default=False
    )

    voting_email_sent = Column(
        Boolean,
        default=False
    )

    created_at = Column(
        DateTime(timezone=True),
        nullable=True
    )