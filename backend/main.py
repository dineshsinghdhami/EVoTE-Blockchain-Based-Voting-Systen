from fastapi import FastAPI, Depends, HTTPException
import secrets
import asyncio
import re
from eth_account.messages import encode_defunct
from web3 import Web3
from sqlalchemy.orm import Session
from sqlalchemy import or_
from fastapi.middleware.cors import CORSMiddleware
from blockchain import (
    w3,
    encode_vote,
    encode_vote_with_session_key,
    submit_session_vote,
    get_post_blockchain,
    get_forwarder_nonce,
    get_vote_nonce,
    encode_register_user,
    encode_become_candidate,
    relay_signed_request,
    get_user_blockchain,
    get_institution_name,
    get_organization_name,
    get_candidate_nonce,
    encode_candidate_with_session_key,
    submit_session_candidate,
    VOTING_CONTRACT_ADDRESS,
    FORWARDER_CONTRACT_ADDRESS
)
from database import engine, SessionLocal
from models import (
    Base,
    User,
    CandidateRequest,
    VoteRecord,
    TransactionHistory,
    CandidateProfile,
    WalletNonce,
    PendingWalletRegistration,
    ElectionNotification
)
from schemas import (
    GaslessRequestPrepare,
    UserCreate,
    WalletNonceRequest,
    WalletVerifyRequest,
    UserLogin,
    MetaMaskRegisterRequest,
    MetaMaskRegisterOTPVerify,
    GaslessRelayRequest,
    CandidateRequestCreate,
    VoteCreate,
    VerifyRegisterOTP,
    ForgotPasswordRequest,
    ResetPasswordVerify,
    CandidateProfileCreate,
    ResendOTP
)
from blockchain import vote_blockchain
from blockchain import add_candidate_blockchain
from blockchain import create_organization_blockchain
from blockchain import approve_candidate_request_blockchain
from blockchain import reject_candidate_request_blockchain
from blockchain import create_institution_blockchain
from blockchain import create_post_blockchain
from auth import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user,
    require_admin,
)
from blockchain import request_candidate_blockchain
import os
import random
import smtplib
from datetime import datetime, timedelta, timezone
from email.message import EmailMessage
from dotenv import load_dotenv
from fastapi import UploadFile, File
from fastapi.staticfiles import StaticFiles

app = FastAPI()



load_dotenv()

EMAIL_USER = os.getenv("EMAIL_USER")
EMAIL_PASS = os.getenv("EMAIL_PASS")
pending_registrations = {}

os.makedirs("uploads/profiles", exist_ok=True)

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

Base.metadata.create_all(bind=engine)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://evote-ivory.vercel.app",
        "https://evote-git-main-thecodingdhamis-projects.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
def generate_otp():
    return str(random.randint(100000, 999999))


def send_email_otp(to_email: str, subject: str, otp: str):
    msg = EmailMessage()

    msg["Subject"] = subject
    msg["From"] = f"EVoTE <{EMAIL_USER}>"
    msg["To"] = to_email

    msg.set_content(f"""
Hello,

Your EVoTE OTP code is: {otp}

This code is valid for 5 minutes.

Do not share this code with anyone.

EVoTE
""")

    html = f"""
<!DOCTYPE html>
<html>
<body style="margin:0; padding:20px; background:#f5f5f5; font-family:Arial,sans-serif;">
  <div style="max-width:500px; margin:auto; background:white; border-radius:16px; overflow:hidden; box-shadow:0 4px 12px rgba(0,0,0,0.10);">
    
    <div style="background:linear-gradient(135deg,#2563eb,#1d4ed8); padding:28px 20px; text-align:center; color:white;">
      <h1 style="margin:0; font-size:26px;">EVoTE ⬢</h1>
      <p style="margin:6px 0 0; font-size:13px; opacity:0.9;">Blockchain Voting Platform</p>
    </div>

    <div style="padding:28px;">
      <h2 style="margin:0 0 12px; color:#111827; font-size:20px;">Your OTP Code</h2>

      <p style="color:#555; font-size:14px; line-height:1.6;">
        Use the code below to continue with EVoTE.
      </p>

      <div style="margin:22px 0; text-align:center; background:#f8fafc; padding:20px; border-radius:12px; border:1px solid #e5e7eb;">
        <span style="font-size:34px; font-weight:800; color:#2563eb; letter-spacing:6px;">
          {otp}
        </span>
      </div>

      <p style="color:#777; font-size:13px; text-align:center;">
        This OTP is valid for 5 minutes.
      </p>
    </div>

    <div style="background:#f8fafc; padding:16px; text-align:center; font-size:12px; color:#888; border-top:1px solid #e5e7eb;">
      © 2026 EVoTE. This is an automated message.
    </div>

  </div>
</body>
</html>
"""

    msg.add_alternative(html, subtype="html")

    with smtplib.SMTP_SSL("smtp.gmail.com", 465) as smtp:
        smtp.login(EMAIL_USER, EMAIL_PASS)
        smtp.send_message(msg)

def send_election_email(
    to_email: str,
    full_name: str,
    subject: str,
    heading: str,
    message_text: str
):
    msg = EmailMessage()

    msg["Subject"] = subject
    msg["From"] = f"EVoTE <{EMAIL_USER}>"
    msg["To"] = to_email

    # Plain text fallback
    msg.set_content(f"""
Hello {full_name},

{message_text}

EVoTE
Blockchain Voting Platform
""")

    # HTML version
    html = f"""
<!DOCTYPE html>
<html>
<body style="
    margin:0;
    padding:20px;
    background:#f5f5f5;
    font-family:Arial,sans-serif;
">

  <div style="
      max-width:550px;
      margin:auto;
      background:white;
      border-radius:16px;
      overflow:hidden;
      box-shadow:0 4px 12px rgba(0,0,0,0.10);
  ">

    <div style="
        background:linear-gradient(135deg,#2563eb,#1d4ed8);
        padding:28px 20px;
        text-align:center;
        color:white;
    ">
      <h1 style="margin:0;font-size:26px;">
        EVoTE
      </h1>

      <p style="
          margin:6px 0 0;
          font-size:13px;
          opacity:0.9;
      ">
        Blockchain Voting Platform
      </p>
    </div>

    <div style="padding:28px;">

      <h2 style="
          margin:0 0 14px;
          color:#111827;
          font-size:21px;
      ">
        {heading}
      </h2>

      <p style="
          color:#374151;
          font-size:15px;
          line-height:1.7;
      ">
        Hello <strong>{full_name}</strong>,
      </p>

      <p style="
          color:#374151;
          font-size:15px;
          line-height:1.7;
          white-space:pre-line;
      ">
        {message_text}
      </p>

      <div style="
          margin-top:24px;
          padding:14px;
          background:#eff6ff;
          border-left:4px solid #2563eb;
          border-radius:6px;
          color:#1e3a8a;
          font-size:13px;
      ">
        Please sign in to EVoTE for complete election details.
      </div>

    </div>

    <div style="
        background:#f8fafc;
        padding:16px;
        text-align:center;
        font-size:12px;
        color:#888;
        border-top:1px solid #e5e7eb;
    ">
      © 2026 EVoTE. This is an automated notification.
    </div>

  </div>

</body>
</html>
"""

    msg.add_alternative(html, subtype="html")

    with smtplib.SMTP_SSL(
        "smtp.gmail.com",
        465
    ) as smtp:

        smtp.login(
            EMAIL_USER,
            EMAIL_PASS
        )

        smtp.send_message(msg)


def calculate_age(date_of_birth):
    if not date_of_birth:
        return None

    today = datetime.now().date()

    age = today.year - date_of_birth.year

    if (
        today.month,
        today.day
    ) < (
        date_of_birth.month,
        date_of_birth.day
    ):
        age -= 1

    return age


def get_candidate_eligible_voters(
    db: Session,
    min_age: int,
    max_age: int
):
    users = (
        db.query(User)
        .filter(
            User.role == "voter",
            User.is_active == True,
            User.is_verified == True,
            User.date_of_birth.isnot(None)
        )
        .all()
    )

    eligible_users = []

    for user in users:
        age = calculate_age(
            user.date_of_birth
        )

        if age is None:
            continue

        if min_age <= age <= max_age:
            eligible_users.append(user)

        return eligible_users


async def voting_notification_worker():
    while True:
        db = SessionLocal()

        try:
            now_timestamp = int(
                datetime.now(timezone.utc).timestamp()
            )

            notifications = (
                db.query(ElectionNotification)
                .filter(
                    ElectionNotification.voting_email_sent == False,
                    ElectionNotification.voting_start <= now_timestamp,
                    ElectionNotification.voting_end >= now_timestamp
                )
                .all()
            )

            for notification in notifications:
                voters = (
                    db.query(User)
                    .filter(
                        User.role == "voter",
                        User.is_active == True,
                        User.is_verified == True
                    )
                    .all()
                )

                voting_end_text = datetime.fromtimestamp(
                    notification.voting_end
                ).strftime(
                    "%d %b %Y, %I:%M %p"
                )

                for voter in voters:
                    try:
                        send_election_email(
                            to_email=voter.email,
                            full_name=voter.full_name,
                            subject=(
                                f"EVoTE - Voting Is Now Open: "
                                f"{notification.title}"
                            ),
                            heading="Voting Is Now Open",
                            message_text=(
                                f"Voting for "
                                f"\"{notification.title}\" "
                                f"is now active.\n\n"
                                f"Please sign in to EVoTE and cast "
                                f"your vote before:\n"
                                f"{voting_end_text}."
                            )
                        )

                    except Exception as email_error:
                        print(
                            f"Voting email failed for "
                            f"{voter.email}: {email_error}"
                        )

                notification.voting_email_sent = True
                db.commit()

                print(
                    f"Voting notification sent for "
                    f"{notification.title} "
                    f"to {len(voters)} voter(s)."
                )

        except Exception as error:
            print(
                "Voting notification worker error:",
                error
            )

        finally:
            db.close()

        await asyncio.sleep(60)


@app.on_event("startup")
async def start_voting_notification_worker():
    asyncio.create_task(
        voting_notification_worker()
    )
    
@app.get("/")
def home():
    return {"message": "Backend running successfully"}

@app.post("/auth/metamask/nonce")
def metamask_nonce(
    data: WalletNonceRequest,
    db: Session = Depends(get_db)
):
    try:
        wallet = Web3.to_checksum_address(
            data.wallet_address
        )
    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Invalid wallet address"
        )

    nonce = secrets.token_hex(16)

    message = (
        "EVoTE Authentication\n\n"
        f"Wallet: {wallet}\n"
        f"Nonce: {nonce}\n\n"
        "Sign this message to prove ownership "
        "of your wallet. This does not cost gas."
    )

    expires_at = (
        datetime.utcnow()
        + timedelta(minutes=5)
    )

    existing = (
        db.query(WalletNonce)
        .filter(
            WalletNonce.wallet_address
            == wallet.lower()
        )
        .first()
    )

    if existing:
        existing.nonce = nonce
        existing.expires_at = expires_at
    else:
        new_nonce = WalletNonce(
            wallet_address=wallet.lower(),
            nonce=nonce,
            expires_at=expires_at
        )

        db.add(new_nonce)

    db.commit()

    return {
        "wallet_address": wallet,
        "message": message,
        "expires_in_seconds": 300
    }

@app.post("/auth/metamask/verify")
def metamask_verify(
    data: WalletVerifyRequest,
    db: Session = Depends(get_db)
):
    try:
        wallet = Web3.to_checksum_address(
            data.wallet_address
        )
    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Invalid wallet address"
        )

    nonce_row = (
        db.query(WalletNonce)
        .filter(
            WalletNonce.wallet_address
            == wallet.lower()
        )
        .first()
    )

    if not nonce_row:
        raise HTTPException(
            status_code=400,
            detail="No active nonce found. Request a new nonce."
        )

    if nonce_row.expires_at < datetime.utcnow():
        db.delete(nonce_row)
        db.commit()

        raise HTTPException(
            status_code=400,
            detail="Nonce expired. Request a new nonce."
        )

    message = (
        "EVoTE Authentication\n\n"
        f"Wallet: {wallet}\n"
        f"Nonce: {nonce_row.nonce}\n\n"
        "Sign this message to prove ownership "
        "of your wallet. This does not cost gas."
    )

    try:
        encoded_message = encode_defunct(
            text=message
        )

        recovered_address = (
            Web3().eth.account.recover_message(
                encoded_message,
                signature=data.signature
            )
        )
    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Invalid MetaMask signature"
        )

    if (
        recovered_address.lower()
        != wallet.lower()
    ):
        raise HTTPException(
            status_code=401,
            detail="Signature does not match wallet"
        )

    # One-time nonce: delete after successful verification
    db.delete(nonce_row)
    db.commit()

    user = (
        db.query(User)
        .filter(
            User.wallet_address == wallet
        )
        .first()
    )

    # New wallet: frontend should send user to registration.
    if not user:
        return {
            "verified": True,
            "wallet_address": wallet,
            "registered": False,
            "role": None
        }

    if not user.is_verified:
        raise HTTPException(
            status_code=403,
            detail="Email verification is required"
        )

    if not user.is_active:
        raise HTTPException(
            status_code=403,
            detail="Your account has been disabled"
        )

    token = create_access_token({
        "user_id": user.id,
        "role": user.role,
        "wallet_address": wallet
    })

    return {
        "verified": True,
        "registered": True,
        "access_token": token,
        "token_type": "bearer",

        "user": {
            "id": user.id,
            "username": user.username,
            "full_name": user.full_name,
            "email": user.email,
            "phone": user.phone,
            "role": user.role,
            "wallet_address": user.wallet_address,
            "profile_picture": user.profile_picture,
            "date_of_birth": (
    user.date_of_birth.isoformat()
    if user.date_of_birth
    else None
),
            "is_active": user.is_active
        }
    }

@app.post("/auth/metamask/register/start")
def metamask_register_start(
    data: MetaMaskRegisterRequest,
    db: Session = Depends(get_db)
):
    try:
        wallet = Web3.to_checksum_address(
            data.wallet_address
        )
    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Invalid wallet address"
        )

    existing_wallet_user = (
        db.query(User)
        .filter(
            User.wallet_address == wallet
        )
        .first()
    )

    if existing_wallet_user:
        raise HTTPException(
            status_code=400,
            detail="This wallet is already registered"
        )

    existing_email_user = (
        db.query(User)
        .filter(
            User.email == data.email
        )
        .first()
    )

    if existing_email_user:
        raise HTTPException(
            status_code=400,
            detail="This email is already registered"
        )

    try:
        dob = datetime.strptime(
            data.date_of_birth,
            "%Y-%m-%d"
        ).date()
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail="Date of birth must be YYYY-MM-DD"
        )

    today = datetime.utcnow().date()

    if dob >= today:
        raise HTTPException(
            status_code=400,
            detail="Invalid date of birth"
        )

    otp = str(
        secrets.randbelow(900000) + 100000
    )

    expires_at = (
        datetime.utcnow()
        + timedelta(minutes=10)
    )

    pending = (
        db.query(PendingWalletRegistration)
        .filter(
            PendingWalletRegistration.wallet_address
            == wallet.lower()
        )
        .first()
    )

    if pending:
        pending.full_name = data.full_name
        pending.email = data.email
        pending.phone = data.phone
        pending.date_of_birth = dob
        pending.otp = otp
        pending.otp_expires = expires_at
    else:
        pending = PendingWalletRegistration(
            wallet_address=wallet.lower(),
            full_name=data.full_name,
            email=data.email,
            phone=data.phone,
            date_of_birth=dob,
            otp=otp,
            otp_expires=expires_at
        )

        db.add(pending)

    db.commit()

    # Use your existing email sending function here.
    # Replace send_email(...) below only if your project
    # uses a different function name.
    send_email_otp(
    data.email,
    "Your EVoTE Registration OTP",
    otp
)

    return {
        "message": "OTP sent successfully",
        "email": data.email,
        "wallet_address": wallet
    }

@app.post("/auth/metamask/register/verify-otp")
def metamask_register_verify_otp(
    data: MetaMaskRegisterOTPVerify,
    db: Session = Depends(get_db)
):
    pending = (
        db.query(PendingWalletRegistration)
        .filter(
            PendingWalletRegistration.email
            == data.email
        )
        .first()
    )

    if not pending:
        raise HTTPException(
            status_code=404,
            detail="Pending registration not found"
        )

    if pending.otp_expires < datetime.utcnow():
        raise HTTPException(
            status_code=400,
            detail="OTP has expired. Please request a new OTP."
        )

    if pending.otp != data.otp:
        raise HTTPException(
            status_code=400,
            detail="Invalid OTP"
        )

    pending.email_verified = True

    db.commit()

    return {
        "verified": True,
        "message": "Email verified successfully",
        "wallet_address": pending.wallet_address,
        "email": pending.email,
        "full_name": pending.full_name
    }

@app.post("/auth/metamask/register/prepare-blockchain")
def prepare_blockchain_registration(
    data: WalletNonceRequest,
    db: Session = Depends(get_db)
):
    try:
        wallet = Web3.to_checksum_address(
            data.wallet_address
        )
    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Invalid wallet address"
        )

    pending = (
        db.query(PendingWalletRegistration)
        .filter(
            PendingWalletRegistration.wallet_address
            == wallet.lower()
        )
        .first()
    )

    if not pending:
        raise HTTPException(
            status_code=404,
            detail="Pending registration not found"
        )

    if not pending.email_verified:
        raise HTTPException(
            status_code=400,
            detail="Email must be verified first"
        )

    existing_user = (
        db.query(User)
        .filter(
            User.wallet_address == wallet
        )
        .first()
    )

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Wallet is already registered"
        )

    # Convert date of birth to Unix timestamp.
    dob_datetime = datetime.combine(
        pending.date_of_birth,
        datetime.min.time()
    ).replace(
        tzinfo=timezone.utc
    )

    date_of_birth_timestamp = int(
        dob_datetime.timestamp()
    )

    # Session key is required for silent voting later
    if not data.session_key:
        raise HTTPException(
            status_code=400,
            detail="Session key is required"
        )

    # Encode Voting.registerUser(fullName, dateOfBirth, sessionKey)
    call_data = encode_register_user(
        pending.full_name,
        date_of_birth_timestamp,
        data.session_key
    )

    # Forwarder nonce prevents replay attacks.
    nonce = get_forwarder_nonce(
        wallet
    )

    deadline = int(
        datetime.now(
            timezone.utc
        ).timestamp()
    ) + 600

    gas_limit = 500000

    domain = {
        "name": "EVoTEForwarder",
        "version": "1",
        "chainId": 11155111,
        "verifyingContract":
            FORWARDER_CONTRACT_ADDRESS
    }

    types = {
        "ForwardRequest": [
            {
                "name": "from",
                "type": "address"
            },
            {
                "name": "to",
                "type": "address"
            },
            {
                "name": "value",
                "type": "uint256"
            },
            {
                "name": "gas",
                "type": "uint256"
            },
            {
                "name": "nonce",
                "type": "uint256"
            },
            {
                "name": "deadline",
                "type": "uint48"
            },
            {
                "name": "data",
                "type": "bytes"
            }
        ]
    }

    message = {
        "from": wallet,
        "to": VOTING_CONTRACT_ADDRESS,
        "value": 0,
        "gas": gas_limit,
        "nonce": nonce,
        "deadline": deadline,
        "data": call_data
    }

    return {
        "domain": domain,
        "types": types,
        "primaryType": "ForwardRequest",
        "message": message
    }

@app.post("/candidate/prepare-blockchain")
def prepare_candidate_blockchain(
    data: dict,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    try:
        wallet = Web3.to_checksum_address(
            data["wallet_address"]
        )
    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Invalid wallet address"
        )

    token_wallet = current_user.get("wallet_address")

    if not token_wallet:
        raise HTTPException(
            status_code=401,
            detail="Logged-in account does not contain a wallet address"
        )

    if token_wallet.lower() != wallet.lower():
        raise HTTPException(
            status_code=403,
            detail="You cannot prepare candidate registration for another wallet"
        )

    user = (
        db.query(User)
        .filter(User.wallet_address == wallet)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    request_row = (
    db.query(CandidateRequest)
    .filter(
        CandidateRequest.user_id == user.id,

        CandidateRequest.institution_id
        == int(data["institution_id"]),

        CandidateRequest.organization_id
        == int(data["organization_id"]),

        CandidateRequest.election_id
        == int(data["post_id"])
    )
    .first()
)

    if not request_row:
        raise HTTPException(
            status_code=404,
            detail="Candidate request not found"
        )

    if request_row.status != "approved":
        raise HTTPException(
            status_code=400,
            detail="Candidate request is not approved"
        )

    call_data = encode_become_candidate(
        int(data["institution_id"]),
        int(data["organization_id"]),
        int(data["post_id"])
    )

    nonce = get_forwarder_nonce(wallet)

    deadline = int(
        datetime.now(
            timezone.utc
        ).timestamp()
    ) + 600

    gas_limit = 500000

    domain = {
        "name": "EVoTEForwarder",
        "version": "1",
        "chainId": 11155111,
        "verifyingContract":
            FORWARDER_CONTRACT_ADDRESS
    }

    types = {
        "ForwardRequest": [
            {
                "name": "from",
                "type": "address"
            },
            {
                "name": "to",
                "type": "address"
            },
            {
                "name": "value",
                "type": "uint256"
            },
            {
                "name": "gas",
                "type": "uint256"
            },
            {
                "name": "nonce",
                "type": "uint256"
            },
            {
                "name": "deadline",
                "type": "uint48"
            },
            {
                "name": "data",
                "type": "bytes"
            }
        ]
    }

    message = {
        "from": wallet,
        "to": VOTING_CONTRACT_ADDRESS,
        "value": 0,
        "gas": gas_limit,
        "nonce": nonce,
        "deadline": deadline,
        "data": call_data
    }

    return {
        "domain": domain,
        "types": types,
        "primaryType": "ForwardRequest",
        "message": message
    }
# ============================================================
# GASLESS VOTE - PREPARE BLOCKCHAIN REQUEST
# ============================================================

@app.post("/vote/prepare-blockchain")
def prepare_vote_blockchain(
    data: GaslessRequestPrepare,
    current_user: dict = Depends(get_current_user)
):
    try:
        wallet = Web3.to_checksum_address(
            data.wallet_address
        )
    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Invalid wallet address"
        )

    token_wallet = current_user.get("wallet_address")

    if not token_wallet:
        raise HTTPException(
            status_code=401,
            detail="Logged-in account does not contain a wallet address"
        )

    if token_wallet.lower() != wallet.lower():
        raise HTTPException(
            status_code=403,
            detail="You cannot prepare a vote for another wallet"
        )

    if data.institution_id is None:
        raise HTTPException(
            status_code=400,
            detail="Institution ID is required"
        )

    if data.organization_id is None:
        raise HTTPException(
            status_code=400,
            detail="Organization ID is required"
        )

    if data.post_id is None:
        raise HTTPException(
            status_code=400,
            detail="Post ID is required"
        )

    if data.candidate_id is None:
        raise HTTPException(
            status_code=400,
            detail="Candidate ID is required"
        )

    # Encode:
    # vote(institution, organization, post, candidate)
    call_data = encode_vote(
        int(data.institution_id),
        int(data.organization_id),
        int(data.post_id),
        int(data.candidate_id)
    )

    # Forwarder nonce
    nonce = get_forwarder_nonce(
        wallet
    )

    # Signature valid for 10 minutes
    deadline = int(
        datetime.now(
            timezone.utc
        ).timestamp()
    ) + 600

    gas_limit = 500000

    domain = {
        "name": "EVoTEForwarder",
        "version": "1",
        "chainId": 11155111,
        "verifyingContract":
            FORWARDER_CONTRACT_ADDRESS
    }

    types = {
        "ForwardRequest": [
            {
                "name": "from",
                "type": "address"
            },
            {
                "name": "to",
                "type": "address"
            },
            {
                "name": "value",
                "type": "uint256"
            },
            {
                "name": "gas",
                "type": "uint256"
            },
            {
                "name": "nonce",
                "type": "uint256"
            },
            {
                "name": "deadline",
                "type": "uint48"
            },
            {
                "name": "data",
                "type": "bytes"
            }
        ]
    }

    message = {
        "from": wallet,
        "to": VOTING_CONTRACT_ADDRESS,
        "value": 0,
        "gas": gas_limit,
        "nonce": nonce,
        "deadline": deadline,
        "data": call_data
    }

    return {
        "domain": domain,
        "types": types,
        "primaryType": "ForwardRequest",
        "message": message
    }

@app.get("/vote/nonce/{wallet_address}")
def get_vote_session_nonce(
    wallet_address: str,
    current_user: dict = Depends(get_current_user)
):
    try:
        wallet = Web3.to_checksum_address(
            wallet_address
        )
    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Invalid wallet address"
        )

    token_wallet = current_user.get(
        "wallet_address"
    )

    if not token_wallet:
        raise HTTPException(
            status_code=401,
            detail="Logged-in account does not contain a wallet address"
        )

    if token_wallet.lower() != wallet.lower():
        raise HTTPException(
            status_code=403,
            detail="You cannot request another user's vote nonce"
        )

    nonce = get_vote_nonce(
        wallet
    )

    return {
        "wallet_address": wallet,
        "nonce": nonce
    }

@app.get("/candidate/nonce/{wallet_address}")
def get_candidate_session_nonce(
    wallet_address: str,
    current_user: dict = Depends(get_current_user)
):
    try:
        wallet = Web3.to_checksum_address(
            wallet_address
        )
    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Invalid wallet address"
        )

    token_wallet = current_user.get(
        "wallet_address"
    )

    if not token_wallet:
        raise HTTPException(
            status_code=401,
            detail="Logged-in account does not contain a wallet address"
        )

    if token_wallet.lower() != wallet.lower():
        raise HTTPException(
            status_code=403,
            detail="You cannot request another user's candidate nonce"
        )

    nonce = get_candidate_nonce(
        wallet
    )

    return {
        "wallet_address": wallet,
        "nonce": nonce
    }


@app.post("/vote/session-relay")
def relay_session_vote(
    data: dict,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    required_fields = [
        "voter_address",
        "institution_id",
        "organization_id",
        "post_id",
        "candidate_id",
        "nonce",
        "signature",
    ]

    for field in required_fields:
        if field not in data:
            raise HTTPException(
                status_code=400,
                detail=f"{field} is required"
            )

    # --------------------------------------------------------
    # 1. VALIDATE VOTER WALLET
    # --------------------------------------------------------

    try:
        voter = Web3.to_checksum_address(
            data["voter_address"]
        )
    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Invalid voter wallet address"
        )

    # --------------------------------------------------------
    # 2. VERIFY LOGGED-IN WALLET
    # --------------------------------------------------------

    token_wallet = current_user.get(
        "wallet_address"
    )

    if not token_wallet:
        raise HTTPException(
            status_code=401,
            detail="Logged-in user has no wallet address"
        )

    if token_wallet.lower() != voter.lower():
        raise HTTPException(
            status_code=403,
            detail="You cannot vote for another wallet"
        )

    # --------------------------------------------------------
    # 3. VERIFY NONCE
    # --------------------------------------------------------

    current_nonce = get_vote_nonce(
        voter
    )

    if int(data["nonce"]) != int(current_nonce):
        raise HTTPException(
            status_code=400,
            detail="Invalid or expired vote nonce"
        )

    # --------------------------------------------------------
    # 4. SEND VOTE TO SEPOLIA
    # --------------------------------------------------------

    try:
        result = submit_session_vote(
            voter_address=voter,

            institution_id=int(
                data["institution_id"]
            ),

            organization_id=int(
                data["organization_id"]
            ),

            post_id=int(
                data["post_id"]
            ),

            candidate_id=int(
                data["candidate_id"]
            ),

            nonce=int(
                data["nonce"]
            ),

            signature=data["signature"]
        )

    except Exception as exc:
        print(
            "SESSION VOTE ERROR:",
            str(exc)
        )

        raise HTTPException(
            status_code=400,
            detail=str(exc)
        )

    # --------------------------------------------------------
    # 5. FIND VOTER IN DATABASE
    # --------------------------------------------------------

    user = (
        db.query(User)
        .filter(
            User.wallet_address == voter
        )
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="Voter not found in database"
        )

    # --------------------------------------------------------
    # 6. GET READABLE ELECTION NAMES
    # --------------------------------------------------------

    try:
        institution_name =get_institution_name(
                int(data["institution_id"])
            )

        organization_name =get_organization_name(
                int(data["institution_id"]),
                int(data["organization_id"])
            )

        post_data =get_post_blockchain(
                int(data["institution_id"]),
                int(data["organization_id"]),
                int(data["post_id"])
            )

        post_title = post_data[1]

        action_text = (
            f"Vote - "
            f"{institution_name} - "
            f"{organization_name} - "
            f"{post_title}"
        )

    except Exception:
        action_text = (
            f"Vote - "
            f"Institution {data['institution_id']} - "
            f"Organization {data['organization_id']} - "
            f"Post {data['post_id']}"
        )

    # --------------------------------------------------------
    # 7. SAVE TRANSACTION HISTORY
    # --------------------------------------------------------

    existing_transaction = (
        db.query(TransactionHistory)
        .filter(
            TransactionHistory.tx_hash ==
                result["tx_hash"]
        )
        .first()
    )

    if not existing_transaction:
        transaction_record = TransactionHistory(
            user_id=user.id,

            full_name=user.full_name,

            email=user.email,

            role=user.role,

            action=action_text,

            tx_hash=result["tx_hash"],

            from_address=voter,

            status="success",

            created_at=datetime.now(
                timezone.utc
            )
        )

        db.add(transaction_record)
        db.commit()

    # --------------------------------------------------------
    # 8. SUCCESS
    # --------------------------------------------------------

    return {
        "success": True,

        "message":
            "Vote recorded successfully",

        "tx_hash":
            result["tx_hash"],

        "block_number":
            result["block_number"]
    }

@app.post("/candidate/session-relay")
def relay_session_candidate(
    data: dict,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    required_fields = [
        "voter_address",
        "institution_id",
        "organization_id",
        "post_id",
        "nonce",
        "signature",
    ]

    for field in required_fields:
        if field not in data:
            raise HTTPException(
                status_code=400,
                detail=f"{field} is required"
            )

    # --------------------------------------------------------
    # 1. VALIDATE VOTER WALLET
    # --------------------------------------------------------

    try:
        voter = Web3.to_checksum_address(
            data["voter_address"]
        )
    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Invalid voter wallet address"
        )

    # --------------------------------------------------------
    # 2. MAKE SURE LOGGED-IN USER OWNS THIS WALLET
    # --------------------------------------------------------

    token_wallet = current_user.get(
        "wallet_address"
    )

    if not token_wallet:
        raise HTTPException(
            status_code=401,
            detail="Logged-in user has no wallet address"
        )

    if token_wallet.lower() != voter.lower():
        raise HTTPException(
            status_code=403,
            detail="You cannot register another wallet as candidate"
        )

    # --------------------------------------------------------
    # 3. FIND USER
    # --------------------------------------------------------

    user = (
        db.query(User)
        .filter(
            User.wallet_address == voter
        )
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    # --------------------------------------------------------
    # 4. VERIFY APPROVED CANDIDATE REQUEST
    # --------------------------------------------------------

    request_row = (
        db.query(CandidateRequest)
        .filter(
            CandidateRequest.user_id == user.id,
            CandidateRequest.institution_id ==
                int(data["institution_id"]),
            CandidateRequest.organization_id ==
                int(data["organization_id"]),
            CandidateRequest.election_id ==
                int(data["post_id"]),
            CandidateRequest.status == "approved"
        )
        .first()
    )

    if not request_row:
        raise HTTPException(
            status_code=400,
            detail="No approved candidate request found"
        )

    # --------------------------------------------------------
    # 5. VERIFY CURRENT CANDIDATE NONCE
    # --------------------------------------------------------

    current_nonce = get_candidate_nonce(
        voter
    )

    if int(data["nonce"]) != int(current_nonce):
        raise HTTPException(
            status_code=400,
            detail="Invalid or expired candidate nonce"
        )

    # --------------------------------------------------------
    # 6. SUBMIT SILENT CANDIDATE REGISTRATION
    # --------------------------------------------------------

    try:
        result = submit_session_candidate(
            voter_address=voter,
            institution_id=int(
                data["institution_id"]
            ),
            organization_id=int(
                data["organization_id"]
            ),
            post_id=int(
                data["post_id"]
            ),
            nonce=int(
                data["nonce"]
            ),
            signature=data["signature"]
        )

    except Exception as exc:
        print(
            "SESSION CANDIDATE ERROR:",
            str(exc)
        )

        raise HTTPException(
            status_code=400,
            detail=str(exc)
        )

    # --------------------------------------------------------
    # 7. MARK DATABASE REQUEST AS REGISTERED
    # --------------------------------------------------------

    request_row.status = "registered"

    institution_name = get_institution_name(
        int(data["institution_id"])
    )

    organization_name = get_organization_name(
        int(data["institution_id"]),
        int(data["organization_id"])
    )

    post_data = get_post_blockchain(
        int(data["institution_id"]),
        int(data["organization_id"]),
        int(data["post_id"])
    )

    post_title = post_data[1]

    transaction_record = TransactionHistory(
        user_id=user.id,
        full_name=user.full_name,
        email=user.email,
        role=user.role,
        action=(
            f"Candidate Registration - "
            f"{institution_name} - "
            f"{organization_name} - "
            f"{post_title}"
        ),
        tx_hash=result["tx_hash"],
        from_address=voter,
        status="success",
        created_at=datetime.now(
            timezone.utc
        )
    )

    db.add(transaction_record)

    db.commit()

    # --------------------------------------------------------
    # 8. RETURN SUCCESS
    # --------------------------------------------------------

    return {
        "success": True,
        "message":
            "Candidate registration completed successfully",
        "status": "registered",
        "tx_hash": result["tx_hash"],
        "block_number": result[
            "block_number"
        ]
    }

@app.post("/candidate/relay")

def relay_candidate_blockchain(
    data: dict,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    # --------------------------------------------------------
    # 1. VALIDATE WALLET
    # --------------------------------------------------------

    try:
        wallet = Web3.to_checksum_address(
            data["from_address"]
        )
    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Invalid wallet address"
        )

    token_wallet = current_user.get("wallet_address")

    if not token_wallet:
        raise HTTPException(
            status_code=401,
            detail="Logged-in account does not contain a wallet address"
        )

    if token_wallet.lower() != wallet.lower():
        raise HTTPException(
            status_code=403,
            detail="You cannot register a candidate from another wallet"
        )

    # --------------------------------------------------------
    # 2. ONLY OUR VOTING CONTRACT
    # --------------------------------------------------------

    if (
        data["to_address"].lower()
        != VOTING_CONTRACT_ADDRESS.lower()
    ):
        raise HTTPException(
            status_code=400,
            detail="Invalid target contract"
        )

    if data["value"] != 0:
        raise HTTPException(
            status_code=400,
            detail="Candidate registration value must be zero"
        )

    # --------------------------------------------------------
    # 3. FIND USER
    # --------------------------------------------------------

    user = (
        db.query(User)
        .filter(User.wallet_address == wallet)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    # --------------------------------------------------------
    # 4. FIND APPROVED REQUEST
    #
    # We recover institution/org/post from request data sent
    # alongside the relay payload below.
    # --------------------------------------------------------

    request_row = (
    db.query(CandidateRequest)
    .filter(
        CandidateRequest.user_id == user.id,
        CandidateRequest.status == "approved",
        CandidateRequest.institution_id == int(data["institution_id"]),
        CandidateRequest.organization_id == int(data["organization_id"]),
        CandidateRequest.election_id == int(data["post_id"])
    )
    .first()
)

    if not request_row:
        raise HTTPException(
            status_code=400,
            detail="No approved candidate request found"
        )

    expected_data = encode_become_candidate(
    int(request_row.institution_id),
    int(request_row.organization_id),
    int(request_row.election_id)
)

    if data["data"].lower() != expected_data.lower():
         raise HTTPException(
            status_code=400,
            detail="Signed candidate registration does not match the approved request"
    )
    # --------------------------------------------------------
    # 5. LIMIT GAS
    # --------------------------------------------------------

    if data["gas"] <= 0 or data["gas"] > 700000:
        raise HTTPException(
            status_code=400,
            detail="Invalid gas limit"
        )

    # --------------------------------------------------------
    # 6. RELAY SIGNED META-TRANSACTION
    #
    # VOTER PAYS 0 ETH.
    # RELAYER PAYS SEPOLIA GAS.
    # --------------------------------------------------------

    try:
        blockchain_result = relay_signed_request(
            from_address=wallet,
            to_address=data["to_address"],
            value=data["value"],
            gas=data["gas"],
            deadline=data["deadline"],
            data=data["data"],
            signature=data["signature"]
        )
    except Exception as error:
        raise HTTPException(
            status_code=400,
            detail=f"Candidate blockchain registration failed: {str(error)}"
        )

    if blockchain_result["status"] != "success":
        raise HTTPException(
            status_code=400,
            detail="Candidate blockchain transaction failed"
        )

    # --------------------------------------------------------
    # 7. MARK DATABASE REQUEST COMPLETE
    # --------------------------------------------------------

    request_row.status = "registered"

    institution_name = get_institution_name(
        int(request_row.institution_id)
    )

    organization_name = get_organization_name(
        int(request_row.institution_id),
        int(request_row.organization_id)
    )

    post_data = get_post_blockchain(
        int(request_row.institution_id),
        int(request_row.organization_id),
        int(request_row.election_id)
    )
    post_title = post_data[1]

    transaction_record = TransactionHistory(
        user_id=user.id,
        full_name=user.full_name,
        email=user.email,
        role=user.role,
        action=(
            f"Candidate Registration - "
            f"{institution_name} - "
            f"{organization_name} - "
            f"{post_title}"
        ),
        tx_hash=blockchain_result["tx_hash"],
        from_address=wallet,
        status="success",
        created_at=datetime.now(timezone.utc)
    )

    db.add(transaction_record)

    db.commit()


    # --------------------------------------------------------
    # 8. RETURN SUCCESS
    # --------------------------------------------------------

    return {
        "message": "Candidate registration completed successfully",
        "status": "registered",
        "transaction": {
            "tx_hash": blockchain_result["tx_hash"],
            "block_number": blockchain_result["block_number"],
            "gas_paid_by_user": "0 ETH"
        }
    }



# ============================================================
# GASLESS VOTE - RELAY SIGNED REQUEST
# ============================================================

@app.post("/vote/relay")
def relay_vote_blockchain(
    data: dict,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    # --------------------------------------------------------
    # 1. REQUIRED VALUES
    # --------------------------------------------------------

    required_fields = [
        "from_address",
        "to_address",
        "value",
        "gas",
        "deadline",
        "data",
        "signature",
        "institution_id",
        "organization_id",
        "post_id",
        "candidate_id",
        "session_key",
    ]

    for field in required_fields:
        if field not in data:
            raise HTTPException(
                status_code=400,
                detail=f"{field} is required"
            )

    # --------------------------------------------------------
    # 2. VALIDATE WALLET
    # --------------------------------------------------------

    try:
        wallet = Web3.to_checksum_address(
            data["from_address"]
        )
    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Invalid wallet address"
        )

    token_wallet = current_user.get("wallet_address")

    if not token_wallet:
        raise HTTPException(
            status_code=401,
            detail="Logged-in account does not contain a wallet address"
        )

    if token_wallet.lower() != wallet.lower():
        raise HTTPException(
            status_code=403,
            detail="You cannot submit a vote from another wallet"
        )

    # --------------------------------------------------------
    # 3. ONLY ALLOW OUR VOTING CONTRACT
    # --------------------------------------------------------

    if (
        data["to_address"].lower()
        != VOTING_CONTRACT_ADDRESS.lower()
    ):
        raise HTTPException(
            status_code=400,
            detail="Invalid voting contract"
        )

    if int(data["value"]) != 0:
        raise HTTPException(
            status_code=400,
            detail="Vote transaction value must be zero"
        )

    # --------------------------------------------------------
    # 4. VERIFY SIGNED DATA IS EXACTLY vote(...)
    # --------------------------------------------------------

    expected_data = encode_vote(
        int(data["institution_id"]),
        int(data["organization_id"]),
        int(data["post_id"]),
        int(data["candidate_id"])
    )

    if (
        str(data["data"]).lower()
        != expected_data.lower()
    ):
        raise HTTPException(
            status_code=400,
            detail="Signed vote does not match the selected candidate"
        )

    # --------------------------------------------------------
    # 5. GAS LIMIT
    # --------------------------------------------------------

    gas_limit = int(data["gas"])

    if (
        gas_limit <= 0
        or gas_limit > 700000
    ):
        raise HTTPException(
            status_code=400,
            detail="Invalid gas limit"
        )

    # --------------------------------------------------------
    # 6. RELAY THE SIGNED VOTE
    #
    # VOTER PAYS 0 ETH.
    # RELAYER PAYS SEPOLIA GAS.
    # --------------------------------------------------------

    try:
        blockchain_result = relay_signed_request(
            from_address=wallet,
            to_address=data["to_address"],
            value=int(data["value"]),
            gas=gas_limit,
            deadline=int(data["deadline"]),
            data=data["data"],
            signature=data["signature"]
        )

    except Exception as error:
        raise HTTPException(
            status_code=400,
            detail=f"Vote failed: {str(error)}"
        )

    if (
        blockchain_result["status"]
        != "success"
    ):
        raise HTTPException(
            status_code=400,
            detail="Blockchain vote transaction failed"
        )

    # --------------------------------------------------------
    # SAVE TRANSACTION HISTORY
    # --------------------------------------------------------

    user = (
        db.query(User)
        .filter(
            User.wallet_address == wallet
        )
        .first()
    )

    institution_name = get_institution_name(
        int(data["institution_id"])
    )

    organization_name = get_organization_name(
        int(data["institution_id"]),
        int(data["organization_id"])
    )

    post_data = get_post_blockchain(
        int(data["institution_id"]),
        int(data["organization_id"]),
        int(data["post_id"])
    )
    post_title = post_data[1]

    transaction_record = TransactionHistory(
        user_id=user.id if user else None,
        full_name=(
            user.full_name
            if user
            else "Unknown Voter"
        ),
        email=(
            user.email
            if user
            else "unknown@evote.local"
        ),
        role=(
            user.role
            if user
            else "voter"
        ),
        action=(
            f"Vote - "
            f"{institution_name} - "
            f"{organization_name} - "
            f"{post_title}"
        ),
        tx_hash=blockchain_result["tx_hash"],
        from_address=wallet,
        status="success",
        created_at=datetime.now(timezone.utc)
    )

    db.add(transaction_record)
    db.commit()


    return {
    "message": "Vote submitted successfully",
    "transaction": {
        "tx_hash":
            blockchain_result["tx_hash"],

        "block_number":
            blockchain_result["block_number"],

        "gas_paid_by_user":
            "0 ETH"
    }
}

@app.post("/auth/metamask/register/relay")
def relay_blockchain_registration(
    data: dict,
    db: Session = Depends(get_db)
):
    # --------------------------------------------------------
    # 1. REQUIRED VALUES
    # --------------------------------------------------------

    required_fields = [
        "from_address",
        "to_address",
        "value",
        "gas",
        "deadline",
        "data",
        "signature",
    ]

    for field in required_fields:
        if field not in data:
            raise HTTPException(
                status_code=400,
                detail=f"{field} is required"
            )

    # --------------------------------------------------------
    # 2. VALIDATE WALLET
    # --------------------------------------------------------

    try:
        wallet = Web3.to_checksum_address(
            data["from_address"]
        )
    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Invalid wallet address"
        )

    # --------------------------------------------------------
    # 3. ONLY ALLOW OUR VOTING CONTRACT
    # --------------------------------------------------------

    if (
        data["to_address"].lower()
        != VOTING_CONTRACT_ADDRESS.lower()
    ):
        raise HTTPException(
            status_code=400,
            detail="Invalid target contract"
        )

    # --------------------------------------------------------
    # 4. REGISTRATION MUST SEND ZERO ETH
    # --------------------------------------------------------

    if int(data["value"]) != 0:
        raise HTTPException(
            status_code=400,
            detail="Registration value must be zero"
        )

    # --------------------------------------------------------
    # 5. FIND VERIFIED PENDING REGISTRATION
    # --------------------------------------------------------

    pending = (
        db.query(PendingWalletRegistration)
        .filter(
            PendingWalletRegistration.wallet_address
            == wallet.lower()
        )
        .first()
    )

    if not pending:
        raise HTTPException(
            status_code=404,
            detail="Pending registration not found"
        )

    if not pending.email_verified:
        raise HTTPException(
            status_code=400,
            detail="Email has not been verified"
        )

    # --------------------------------------------------------
    # 6. MAKE SURE USER DOES NOT ALREADY EXIST
    # --------------------------------------------------------

    existing_user = (
        db.query(User)
        .filter(
            User.wallet_address == wallet
        )
        .first()
    )

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Wallet is already registered"
        )

    blockchain_user = get_user_blockchain(wallet)

    if (
        blockchain_user["registered"]
        and int(blockchain_user["role"]) == 3
    ):
        new_user = User(
            username=None,
            full_name=pending.full_name,
            email=pending.email,
            phone=pending.phone,
            password_hash=None,
            role="superadmin",
            wallet_address=wallet,
            date_of_birth=pending.date_of_birth,
            profile_picture=None,
            is_active=True,
            is_verified=True,
            register_otp=None,
            register_otp_expires=None
        )

        db.add(new_user)
        db.delete(pending)
        db.commit()
        db.refresh(new_user)

        token = create_access_token({
            "user_id": new_user.id,
            "role": "superadmin",
            "wallet_address": wallet
        })

        return {
            "message": "SuperAdmin account synchronized successfully",
            "access_token": token,
            "token_type": "bearer",
            "user": {
                "id": new_user.id,
                "full_name": new_user.full_name,
                "email": new_user.email,
                "phone": new_user.phone,
                "role": "superadmin",
                "wallet_address": new_user.wallet_address
            }
        }

    existing_email = (
        db.query(User)
        .filter(
            User.email == pending.email
        )
        .first()
    )

    if existing_email:
        raise HTTPException(
            status_code=400,
            detail="Email is already registered"
        )

    existing_phone = (
        db.query(User)
        .filter(
            User.phone == pending.phone
        )
        .first()
    )

    if existing_phone:
        raise HTTPException(
            status_code=400,
            detail="Phone number is already registered"
        )

    # --------------------------------------------------------
    # 7. RECREATE EXPECTED BLOCKCHAIN CALL DATA
    # --------------------------------------------------------

    dob_datetime = datetime.combine(
        pending.date_of_birth,
        datetime.min.time()
    ).replace(
        tzinfo=timezone.utc
    )

    dob_timestamp = int(
        dob_datetime.timestamp()
    )

    if "session_key" not in data:
        raise HTTPException(
        status_code=400,
        detail="Session key is required"
    )

    expected_data = encode_register_user(
        pending.full_name,
        dob_timestamp,
        data["session_key"]
    )

    if (
        str(data["data"]).lower()
        != expected_data.lower()
    ):
        raise HTTPException(
            status_code=400,
            detail="Signed registration data does not match pending user"
        )

    # --------------------------------------------------------
    # 8. LIMIT GAS VALUE
    # --------------------------------------------------------

    gas_limit = int(data["gas"])

    if gas_limit <= 0 or gas_limit > 700000:
        raise HTTPException(
            status_code=400,
            detail="Invalid gas limit"
        )

    # --------------------------------------------------------
    # 9. RELAY SIGNED REQUEST
    # --------------------------------------------------------

    try:
        blockchain_result = relay_signed_request(
            from_address=wallet,
            to_address=data["to_address"],
            value=int(data["value"]),
            gas=gas_limit,
            deadline=int(data["deadline"]),
            data=data["data"],
            signature=data["signature"]
        )
    except Exception as error:
        raise HTTPException(
            status_code=400,
            detail=f"Blockchain registration failed: {str(error)}"
        )

    if blockchain_result["status"] != "success":
        raise HTTPException(
            status_code=400,
            detail="Blockchain transaction failed"
        )

    # --------------------------------------------------------
    # 10. VERIFY USER EXISTS ON BLOCKCHAIN
    # --------------------------------------------------------

    blockchain_user = get_user_blockchain(
        wallet
    )

    if not blockchain_user["registered"]:
        raise HTTPException(
            status_code=500,
            detail="Blockchain transaction completed but user registration was not found"
        )

    # --------------------------------------------------------
    # 11. CREATE DATABASE USER
    # --------------------------------------------------------

    new_user = User(
        username=None,
        full_name=pending.full_name,
        email=pending.email,
        phone=pending.phone,
        password_hash=None,
        role="voter",
        wallet_address=wallet,
        date_of_birth=pending.date_of_birth,
        profile_picture=None,
        is_active=True,
        is_verified=True,
        register_otp=None,
        register_otp_expires=None
    )

    db.add(new_user)
    db.delete(pending)

    db.commit()
    db.refresh(new_user)

    # --------------------------------------------------------
    # SAVE USER REGISTRATION TRANSACTION HISTORY
    # --------------------------------------------------------

    registration_transaction = TransactionHistory(
        user_id=new_user.id,
        full_name=new_user.full_name,
        email=new_user.email,
        role=new_user.role,
        action="User Registration",
        tx_hash=blockchain_result["tx_hash"],
        from_address=wallet,
        status="success",
        created_at=datetime.now(timezone.utc)
    )

    db.add(registration_transaction)
    db.commit()

    # --------------------------------------------------------
    # 12. CREATE LOGIN TOKEN
    # --------------------------------------------------------

    token = create_access_token({
        "user_id": new_user.id,
        "role": new_user.role,
        "wallet_address": wallet
    })

    # --------------------------------------------------------
    # 13. RETURN SUCCESS
    # --------------------------------------------------------

    return {
        "message": "EVoTE registration completed successfully",
        "access_token": token,
        "token_type": "bearer",

        "transaction": {
            "tx_hash": blockchain_result["tx_hash"],
            "block_number": blockchain_result["block_number"],
            "gas_paid_by_user": "0 ETH"
        },

        "user": {
            "id": new_user.id,
            "full_name": new_user.full_name,
            "email": new_user.email,
            "phone": new_user.phone,
            "role": new_user.role,
            "wallet_address": new_user.wallet_address
        }
    }

@app.post("/register")
def register(user: UserCreate, db: Session = Depends(get_db)):
    if user.password != user.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match")

    existing_user = db.query(User).filter(
        or_(
            User.username == user.username,
            User.email == user.email,
            User.phone == user.phone
        )
    ).first()

    if existing_user:
        raise HTTPException(status_code=400, detail="Username, email, or phone already exists")

    otp = generate_otp()

    pending_registrations[user.email] = {
        "username": user.username,
        "full_name": user.full_name,
        "email": user.email,
        "phone": user.phone,
        "password": user.password,
        "otp": otp,
        "expires": datetime.utcnow() + timedelta(minutes=5)
    }

    send_email_otp(user.email, "Your EVoTE OTP Code", otp)

    return {
        "message": "OTP sent to email. Verify OTP to complete registration.",
        "email": user.email
    }

@app.post("/verify-register-otp")
def verify_register_otp(data: VerifyRegisterOTP, db: Session = Depends(get_db)):
    pending_user = pending_registrations.get(data.email)

    if not pending_user:
        raise HTTPException(status_code=404, detail="No pending registration found")

    if pending_user["otp"] != data.otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")

    if datetime.utcnow() > pending_user["expires"]:
        del pending_registrations[data.email]
        raise HTTPException(status_code=400, detail="OTP expired. Please register again")

    existing_user = db.query(User).filter(
        or_(
            User.username == pending_user["username"],
            User.email == pending_user["email"],
            User.phone == pending_user["phone"]
        )
    ).first()

    if existing_user:
        del pending_registrations[data.email]
        raise HTTPException(status_code=400, detail="Username, email, or phone already exists")

    new_user = User(
        username=pending_user["username"],
        full_name=pending_user["full_name"],
        email=pending_user["email"],
        phone=pending_user["phone"],
        password_hash=hash_password(pending_user["password"]),
        role="voter",
        is_verified=True,
        register_otp=None,
        register_otp_expires=None
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    del pending_registrations[data.email]

    return {"message": "Email verified and registration completed successfully"}

@app.post("/resend-register-otp")
def resend_register_otp(data: ResendOTP):
    pending_user = pending_registrations.get(data.email)

    if not pending_user:
        raise HTTPException(status_code=404, detail="No pending registration found")

    otp = generate_otp()

    pending_user["otp"] = otp
    pending_user["expires"] = datetime.utcnow() + timedelta(minutes=5)

    send_email_otp(data.email, "Your New EVoTE OTP Code", otp)

    return {"message": "OTP resent successfully"}

@app.post("/forgot-password")
def forgot_password(data: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()

    if not user:
        raise HTTPException(status_code=404, detail="Email not found")

    otp = generate_otp()

    user.reset_otp = otp
    user.reset_otp_expires = datetime.utcnow() + timedelta(minutes=5)

    db.commit()

    send_email_otp(user.email, "Reset Your EVoTE Password", otp)

    return {"message": "Password reset OTP sent to email"}


@app.post("/resend-reset-otp")
def resend_reset_otp(data: ResendOTP, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()

    if not user:
        raise HTTPException(status_code=404, detail="Email not found")

    otp = generate_otp()

    user.reset_otp = otp
    user.reset_otp_expires = datetime.utcnow() + timedelta(minutes=5)

    db.commit()

    send_email_otp(user.email, "Your New Password Reset OTP", otp)

    return {"message": "OTP resent successfully"}

@app.post("/reset-password")
def reset_password(data: ResetPasswordVerify, db: Session = Depends(get_db)):
    if data.new_password != data.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match")

    user = db.query(User).filter(User.email == data.email).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.reset_otp != data.otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")

    if not user.reset_otp_expires or datetime.utcnow() > user.reset_otp_expires:
        raise HTTPException(status_code=400, detail="OTP expired")

    user.password_hash = hash_password(data.new_password)
    user.is_verified = True
    user.register_otp = None
    user.register_otp_expires = None
    user.reset_otp = None
    user.reset_otp_expires = None

    db.commit()

    return {"message": "Password reset successfully"}


@app.post("/login")
def login(user: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(
        or_(
            User.username == user.username_or_email,
            User.email == user.username_or_email
        )
    ).first()

    if not db_user:
        raise HTTPException(status_code=400, detail="Invalid username/email or password")

    if not verify_password(user.password, db_user.password_hash):
        raise HTTPException(status_code=400, detail="Invalid username/email or password")
    
    if not db_user.is_verified:
        raise HTTPException(status_code=403, detail="Please verify your email first")
    
    if not db_user.is_active:
        raise HTTPException(
        status_code=403,
        detail="Your account has been disabled"
    )  
      
    
    

    token = create_access_token({
    "user_id": db_user.id,
    "role": db_user.role,
    "wallet_address": db_user.wallet_address
})

    return {
        "message": "Login successful",
        "access_token": token,
        "token_type": "bearer",
        "user": {
    "id": db_user.id,
    "username": db_user.username,
    "full_name": db_user.full_name,
    "email": db_user.email,
    "phone": db_user.phone,
    "role": db_user.role,
    "wallet_address": db_user.wallet_address,
    "profile_picture": db_user.profile_picture,
    "date_of_birth": (
        db_user.date_of_birth.isoformat()
        if db_user.date_of_birth
        else None
    ),
    "is_active": db_user.is_active
}
    }


@app.get("/users")
def get_users(
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin)
):
    users = db.query(User).all()

    safe_users = []

    for user in users:

        # -----------------------------------------------------
        # FIND BLOCKCHAIN USER REGISTRATION TRANSACTION
        # -----------------------------------------------------

        registration_transaction = (
            db.query(TransactionHistory)
            .filter(
                TransactionHistory.user_id == user.id,
                TransactionHistory.action == "User Registration",
                TransactionHistory.status == "success"
            )
            .order_by(
                TransactionHistory.id.desc()
            )
            .first()
        )

        safe_users.append({
            "id": user.id,
            "full_name": user.full_name,
            "username": user.username,
            "email": user.email,
            "phone": user.phone,
            "wallet_address": user.wallet_address,
            "role": user.role,
            "date_of_birth": user.date_of_birth,
            "profile_picture": user.profile_picture,
            "is_active": user.is_active,
            "is_verified": user.is_verified,

            # Blockchain registration proof
            "registration_tx_hash": (
                registration_transaction.tx_hash
                if registration_transaction
                else None
            ),
        })

    return safe_users

@app.post("/request-candidate/{user_id}")
def request_candidate(
    user_id: int,
    request: CandidateRequestCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    if current_user["user_id"] != user_id:
        raise HTTPException(
            status_code=403,
            detail="You can only submit your own candidate request"
        )

    existing_request = db.query(CandidateRequest).filter(
        CandidateRequest.user_id == user_id,
        CandidateRequest.institution_id == request.institution_id,
        CandidateRequest.organization_id == request.organization_id,
        CandidateRequest.election_id == request.election_id
    ).first()

    if existing_request:
        if existing_request.status == "approved":
            raise HTTPException(status_code=400, detail="You are already a candidate")
        else:
            raise HTTPException(status_code=400, detail="You already requested to be candidate")

    new_request = CandidateRequest(
    user_id=user_id,
    institution_id=request.institution_id,
    organization_id=request.organization_id,
    election_id=request.election_id,
    status="pending"
)

    db.add(new_request)
    db.commit()
    db.refresh(new_request)

    return {"message": "Candidate request submitted"}

@app.get("/candidate-requests")
def get_candidate_requests(
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin)
):
    from datetime import date

    requests = db.query(CandidateRequest).all()

    result = []

    for r in requests:
        user = (
            db.query(User)
            .filter(User.id == r.user_id)
            .first()
        )

        # =====================================================
        # CALCULATE AGE
        # =====================================================

        age = None

        if user and user.date_of_birth:
            today = date.today()

            age = (
                today.year
                - user.date_of_birth.year
                - (
                    (today.month, today.day)
                    <
                    (
                        user.date_of_birth.month,
                        user.date_of_birth.day,
                    )
                )
            )

        # =====================================================
        # GET BLOCKCHAIN NAMES
        # =====================================================

        institution_name = "Not available"
        organization_name = "Not available"
        post_name = "Not available"

        try:
            institution_name = get_institution_name(
                int(r.institution_id)
            )
        except Exception as error:
            print(
                "Failed to get institution name:",
                error
            )

        try:
            organization_name = get_organization_name(
                int(r.institution_id),
                int(r.organization_id)
            )
        except Exception as error:
            print(
                "Failed to get organization name:",
                error
            )

        try:
            post_data = get_post_blockchain(
                int(r.institution_id),
                int(r.organization_id),
                int(r.election_id)
            )

            post_name = post_data[1]

        except Exception as error:
            print(
                "Failed to get post name:",
                error
            )

        # =====================================================
        # RESPONSE
        # =====================================================

        result.append({
            "id": r.id,
            "user_id": r.user_id,

            "institution_id": r.institution_id,
            "organization_id": r.organization_id,
            "election_id": r.election_id,
            "post_id": r.election_id,

            "institution_name": institution_name,
            "organization_name": organization_name,
            "post_name": post_name,

            "status": r.status,

            "candidate_name":
                user.full_name
                if user
                else "Unknown User",

            "email":
                user.email
                if user
                else "",

            "age": age,

            "date_of_birth":
                user.date_of_birth.isoformat()
                if user and user.date_of_birth
                else None,

            "wallet_address":
                user.wallet_address
                if user
                else "",
        })

    return result

@app.get(
    "/candidate-request-status/"
    "{user_id}/"
    "{institution_id}/"
    "{organization_id}/"
    "{election_id}"
)
def candidate_request_status(
    user_id: int,
    institution_id: int,
    organization_id: int,
    election_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    if (
        current_user["role"] not in ["admin", "superadmin"]
        and current_user["user_id"] != user_id
    ):
        raise HTTPException(
            status_code=403,
            detail="You can only view your own candidate request status"
        )

    request = (
        db.query(CandidateRequest)
        .filter(
            CandidateRequest.user_id == user_id,
            CandidateRequest.institution_id == institution_id,
            CandidateRequest.organization_id == organization_id,
            CandidateRequest.election_id == election_id,
        )
        .first()
    )

    if not request:
        return {"status": "none"}

    return {"status": request.status}


@app.put("/approve-candidate/{request_id}")
def approve_candidate(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin)
):
    candidate_request = db.query(CandidateRequest).filter(
        CandidateRequest.id == request_id
    ).first()

    if not candidate_request:
        raise HTTPException(status_code=404, detail="Request not found")

    candidate_request.status = "approved"
    db.commit()

    return {"message": "Candidate approved"}

@app.put("/reject-candidate/{request_id}")
def reject_candidate(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin)
):
    candidate_request = db.query(CandidateRequest).filter(
        CandidateRequest.id == request_id
    ).first()

    if not candidate_request:
        raise HTTPException(status_code=404, detail="Request not found")

    candidate_request.status = "rejected"
    db.commit()

    return {"message": "Candidate request rejected"}

@app.get("/user/{user_id}")
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    if (
        current_user["role"] not in ["admin", "superadmin"]
        and current_user["user_id"] != user_id
    ):
        raise HTTPException(
            status_code=403,
            detail="You can only view your own profile"
        )

    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    return {
        "id": user.id,
        "username": user.username,
        "full_name": user.full_name,
        "email": user.email,
        "phone": user.phone,
        "role": user.role,
        "wallet_address": user.wallet_address,
        "profile_picture": user.profile_picture,
        "date_of_birth": (
            user.date_of_birth.isoformat()
            if user.date_of_birth
            else None
        ),
    }
# ============================================================
# TRANSACTION DISPLAY HELPERS
# ============================================================

def normalize_transaction_action(action: str):
    """
    Convert legacy ID-based transaction labels into readable
    institution / organization / election-post names.

    New transactions are already saved with names. This helper
    also makes older Candidate Registration and Vote rows display
    names in both Admin and Voter transaction pages.
    """
    if not action:
        return action

    # Legacy candidate registration:
    # Candidate Registration - Institution 1, Organization 1, Post 3
    candidate_match = re.fullmatch(
        r"Candidate Registration - Institution (\d+), Organization (\d+), Post (\d+)",
        action.strip(),
    )

    # Legacy vote:
    # Vote - Institution 1, Organization 1, Post 2, Candidate 1
    vote_match = re.fullmatch(
        r"Vote - Institution (\d+), Organization (\d+), Post (\d+), Candidate (\d+)",
        action.strip(),
    )

    match = candidate_match or vote_match

    if not match:
        return action

    institution_id = int(match.group(1))
    organization_id = int(match.group(2))
    post_id = int(match.group(3))

    try:
        institution_name = get_institution_name(institution_id)
        organization_name = get_organization_name(
            institution_id,
            organization_id
        )
        post_data = get_post_blockchain(
            institution_id,
            organization_id,
            post_id
        )
        post_title = post_data[1]

        if candidate_match:
            return (
                f"Candidate Registration - "
                f"{institution_name} - "
                f"{organization_name} - "
                f"{post_title}"
            )

        return (
            f"Vote - "
            f"{institution_name} - "
            f"{organization_name} - "
            f"{post_title}"
        )

    except Exception:
        # If an old blockchain deployment is no longer available,
        # keep the historical label rather than breaking the page.
        return action


def serialize_transaction(tx):

    # ========================================================
    # DEFAULT BLOCKCHAIN VERIFICATION VALUES
    # ========================================================

    blockchain_verified = False
    blockchain_status = "unverified"

    block_number = None
    blockchain_from = None
    blockchain_to = None

    confirmations = 0

    network = "Ethereum Sepolia"

    etherscan_url = None


    # ========================================================
    # VERIFY TRANSACTION DIRECTLY FROM ETHEREUM SEPOLIA
    # ========================================================

    if tx.tx_hash:

        try:

            tx_hash = str(
                tx.tx_hash
            ).strip()

            # Web3 expects a normal 0x transaction hash.
            if not tx_hash.startswith("0x"):
                tx_hash = f"0x{tx_hash}"


            # ------------------------------------------------
            # GET REAL TRANSACTION FROM SEPOLIA
            # ------------------------------------------------

            blockchain_tx = (
                w3.eth.get_transaction(
                    tx_hash
                )
            )


            # ------------------------------------------------
            # GET REAL TRANSACTION RECEIPT
            # ------------------------------------------------

            receipt = (
                w3.eth.get_transaction_receipt(
                    tx_hash
                )
            )


            # ------------------------------------------------
            # BLOCK INFORMATION
            # ------------------------------------------------

            block_number = (
                receipt.blockNumber
            )


            latest_block = (
                w3.eth.block_number
            )


            confirmations = max(
                0,
                latest_block -
                block_number +
                1
            )


            # ------------------------------------------------
            # REAL BLOCKCHAIN ADDRESSES
            # ------------------------------------------------

            blockchain_from = (
                blockchain_tx["from"]
            )

            blockchain_to = (
                blockchain_tx["to"]
            )


            # ------------------------------------------------
            # VERIFY TRANSACTION SUCCESS
            # ------------------------------------------------

            if receipt.status == 1:

                blockchain_verified = True

                blockchain_status = (
                    "verified"
                )

            else:

                blockchain_verified = False

                blockchain_status = (
                    "failed"
                )


            # ------------------------------------------------
            # ETHERSCAN
            # ------------------------------------------------

            etherscan_url = (
                "https://sepolia.etherscan.io/tx/"
                f"{tx_hash}"
            )


        except Exception as blockchain_error:

            print(
                "Blockchain transaction verification failed:",
                blockchain_error
            )

            blockchain_verified = False

            blockchain_status = (
                "not_found"
            )


    # ========================================================
    # RESPONSE
    # ========================================================

    return {

        # ----------------------------------------------------
        # DATABASE INFORMATION
        # ----------------------------------------------------

        "id": tx.id,

        "user_id": tx.user_id,

        "full_name":
            tx.full_name,

        "email":
            tx.email,

        "role":
            tx.role,

        "action":
            normalize_transaction_action(
                tx.action
            ),

        "tx_hash":
            tx.tx_hash,

        "from_address":
            tx.from_address,

        "status":
            tx.status,

        "created_at":
            tx.created_at,


        # ----------------------------------------------------
        # REAL BLOCKCHAIN VERIFICATION
        # ----------------------------------------------------

        "blockchain_verified":
            blockchain_verified,

        "blockchain_status":
            blockchain_status,

        "network":
            network,

        "block_number":
            block_number,

        "confirmations":
            confirmations,

        "blockchain_from":
            blockchain_from,

        "blockchain_to":
            blockchain_to,

        "etherscan_url":
            etherscan_url,
    }


# ============================================================
# TRANSACTION HISTORY
# ============================================================

@app.get("/transactions")
def get_all_transactions(
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin)
):
    transactions = (
        db.query(TransactionHistory)
        .order_by(
            TransactionHistory.id.desc()
        )
        .all()
    )

    return [serialize_transaction(tx) for tx in transactions]


@app.get("/transactions/user/{user_id}")
def get_user_transactions(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    if (
        current_user["role"] not in ["admin", "superadmin"]
        and current_user["user_id"] != user_id
    ):
        raise HTTPException(
            status_code=403,
            detail="You can only view your own transactions"
        )

    transactions = (
        db.query(TransactionHistory)
        .filter(
            TransactionHistory.user_id == user_id
        )
        .order_by(
            TransactionHistory.id.desc()
        )
        .all()
    )

    return [serialize_transaction(tx) for tx in transactions]

@app.post("/save-vote/{user_id}")
def save_vote(
    user_id: int,
    vote: VoteCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    if (
        current_user["role"] not in ["admin", "superadmin"]
        and current_user["user_id"] != user_id
    ):
        raise HTTPException(
            status_code=403,
            detail="You can only save your own vote record"
        )

    existing_vote = db.query(VoteRecord).filter(
        VoteRecord.user_id == user_id,
        VoteRecord.institution_id == vote.institution_id,
        VoteRecord.election_id == vote.election_id,
        VoteRecord.candidate_id == vote.candidate_id
    ).first()

    if existing_vote:
        raise HTTPException(
            status_code=400,
            detail="This vote is already saved"
        )

    new_vote = VoteRecord(
        user_id=user_id,
        institution_id=vote.institution_id,
        election_id=vote.election_id,
        candidate_id=vote.candidate_id,
        tx_hash=vote.tx_hash
    )

    db.add(new_vote)
    db.commit()
    db.refresh(new_vote)

    return {
        "message": "Vote saved successfully"
    }

@app.get(
    "/vote-record/{user_id}/{institution_id}/{election_id}/{candidate_id}"
)
def get_vote_record(
    user_id: int,
    institution_id: int,
    election_id: int,
    candidate_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    if (
        current_user["role"] not in [
            "admin",
            "superadmin"
        ]
        and current_user["user_id"] != user_id
    ):
        raise HTTPException(
            status_code=403,
            detail="You can only view your own vote record"
        )

    vote = (
        db.query(VoteRecord)
        .filter(
            VoteRecord.user_id == user_id,
            VoteRecord.institution_id ==
                institution_id,
            VoteRecord.election_id ==
                election_id,
            VoteRecord.candidate_id ==
                candidate_id
        )
        .first()
    )

    if not vote:
        return {
            "found": False,
            "tx_hash": None
        }

    return {
        "found": True,
        "tx_hash": vote.tx_hash
    }

@app.post("/upload-profile/{user_id}")
async def upload_profile_picture(
    user_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):

        if (
        current_user["role"] not in ["admin", "superadmin"]
        and current_user["user_id"] != user_id
    ):
            raise HTTPException(
            status_code=403,
            detail="You can only upload your own profile picture"
        )

        user = db.query(User).filter(User.id == user_id).first()

        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        file_extension = file.filename.split(".")[-1]
        file_name = f"user_{user_id}.{file_extension}"
        file_path = f"uploads/profiles/{file_name}"

        with open(file_path, "wb") as buffer:
            buffer.write(await file.read())

        user.profile_picture = file_path
        db.commit()
        db.refresh(user)

        return {
            "message": "Profile picture uploaded",
            "profile_picture": user.profile_picture
        }


@app.post("/candidate-profile")
def create_candidate_profile(
    data: CandidateProfileCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin)
):
    existing = db.query(CandidateProfile).filter(
        CandidateProfile.institution_id == data.institution_id,
        CandidateProfile.election_id == data.election_id,
        CandidateProfile.candidate_id == data.candidate_id
    ).first()

    if existing:
        existing.name = data.name
        existing.department = data.department
        existing.semester = data.semester
        existing.bio = data.bio
        existing.agenda = data.agenda
        existing.photo = data.photo

        db.commit()
        db.refresh(existing)

        return {"message": "Candidate profile updated", "profile": existing}

    profile = CandidateProfile(
        institution_id=data.institution_id,
        election_id=data.election_id,
        candidate_id=data.candidate_id,
        name=data.name,
        department=data.department,
        semester=data.semester,
        bio=data.bio,
        agenda=data.agenda,
        photo=data.photo
    )

    db.add(profile)
    db.commit()
    db.refresh(profile)

    return {"message": "Candidate profile created", "profile": profile}


@app.get("/candidate-profiles/{institution_id}/{election_id}")
def get_candidate_profiles(
    institution_id: int,
    election_id: int,
    db: Session = Depends(get_db)
):
    """
    Return the normal EVoTE user profile information for users who
    successfully registered as candidates.

    CandidateVoting.jsx matches this response to blockchain candidates
    by wallet address, so the user's existing profile picture is reused.
    No separate candidate photo upload is required.
    """

    candidate_requests = (
        db.query(CandidateRequest)
        .filter(
            CandidateRequest.institution_id == institution_id,
            CandidateRequest.election_id == election_id,
            CandidateRequest.status == "registered"
        )
        .all()
    )

    result = []

    for candidate_request in candidate_requests:
        user = (
            db.query(User)
            .filter(
                User.id == candidate_request.user_id
            )
            .first()
        )

        if not user:
            continue

        age = calculate_age(
            user.date_of_birth
        )

        result.append({
            "user_id": user.id,
            "name": user.full_name,
            "age": age,
            "wallet_address": user.wallet_address,
            "photo": user.profile_picture or "",
            "institution_id": candidate_request.institution_id,
            "organization_id": candidate_request.organization_id,
            "election_id": candidate_request.election_id,
        })

    return result


os.makedirs("uploads/candidates", exist_ok=True)

@app.post("/upload-candidate-photo/{profile_id}")
async def upload_candidate_photo(
    profile_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin)
):
    profile = db.query(CandidateProfile).filter(CandidateProfile.id == profile_id).first()

    if not profile:
        raise HTTPException(status_code=404, detail="Candidate profile not found")

    file_extension = file.filename.split(".")[-1]
    file_name = f"candidate_{profile_id}.{file_extension}"
    file_path = f"uploads/candidates/{file_name}"

    with open(file_path, "wb") as buffer:
        buffer.write(await file.read())

    profile.photo = file_path
    db.commit()
    db.refresh(profile)

    return {
        "message": "Candidate photo uploaded",
        "photo": profile.photo
    }


@app.get("/test-blockchain")
def test_blockchain():
    return {
        "connected": w3.is_connected()
    }


@app.post("/blockchain/create-institution")
def create_institution(
    data: dict,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin)
):
    result = create_institution_blockchain(
        data["name"],
        data.get("full_name", "Admin"),
        data.get("email", "admin@evote.local")
    )

    if result["status"] != "success":
        raise HTTPException(
            status_code=400,
            detail="Institution blockchain transaction failed"
        )

    admin = (
        db.query(User)
        .filter(
            User.id == current_user["user_id"]
        )
        .first()
    )

    transaction_record = TransactionHistory(
        user_id=admin.id if admin else current_user["user_id"],
        full_name=admin.full_name if admin else "Admin",
        email=admin.email if admin else "admin@evote.local",
        role=current_user["role"],
        action=f"Create Institution - {data['name']}",
        tx_hash=result["tx_hash"],
        from_address=result.get("from_address"),
        status="success",
        created_at=datetime.now(timezone.utc)
    )

    db.add(transaction_record)
    db.commit()

    return result


@app.post("/blockchain/create-organization")
def create_organization(
    data: dict,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin)
):
    result = create_organization_blockchain(
        int(data["institution_id"]),
        data["name"],
        data.get("full_name", "Admin"),
        data.get("email", "admin@evote.local")
    )

    if result["status"] != "success":
        raise HTTPException(
            status_code=400,
            detail="Organization blockchain transaction failed"
        )

    admin = (
        db.query(User)
        .filter(
            User.id == current_user["user_id"]
        )
        .first()
    )

    institution_name = get_institution_name(
    int(data["institution_id"])
)

    transaction_record = TransactionHistory(
        user_id=admin.id if admin else current_user["user_id"],
        full_name=admin.full_name if admin else "Admin",
        email=admin.email if admin else "admin@evote.local",
        role=current_user["role"],
        action=(
        f"Create Organization - "
        f"({institution_name}) - "
        f"{data['name']}"
    ),
        tx_hash=result["tx_hash"],
        from_address=result.get("from_address"),
        status="success",
        created_at=datetime.now(timezone.utc)
    )

    db.add(transaction_record)
    db.commit()

    return result


@app.post("/blockchain/create-post")
def create_post(
    data: dict,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin)
):
    try:
        result = create_post_blockchain(
            institution_id=int(data["institution_id"]),
            organization_id=int(data["organization_id"]),
            title=data["title"],
            seat_limit=int(data["seat_count"]),
            start_date=int(data["voting_start"]),
            end_date=int(data["voting_end"]),
            full_name=data.get(
                "full_name",
                "Admin"
            ),
            email=data.get(
                "email",
                "admin@evote.local"
            ),
            max_candidate_count=int(
                data["max_candidate_count"]
            ),
            min_candidate_age=int(
                data["min_candidate_age"]
            ),
            max_candidate_age=int(
                data["max_candidate_age"]
            ),
            candidate_registration_start=int(
                data["candidate_registration_start"]
            ),
            candidate_registration_end=int(
                data["candidate_registration_end"]
            )
        )

        if result["status"] != "success":
            raise HTTPException(
                status_code=400,
                detail="Post blockchain transaction failed"
            )

        admin = (
            db.query(User)
            .filter(
                User.id == current_user["user_id"]
            )
            .first()
        )

        institution_name = get_institution_name(
            int(data["institution_id"])
        )

        organization_name = get_organization_name(
            int(data["institution_id"]),
            int(data["organization_id"])
        )

        transaction_record = TransactionHistory(
            user_id=(
                admin.id
                if admin
                else current_user["user_id"]
            ),
            full_name=(
                admin.full_name
                if admin
                else "Admin"
            ),
            email=(
                admin.email
                if admin
                else "admin@evote.local"
            ),
            role=current_user["role"],
            action=(
                f"Create Election/Post - "
                f"({institution_name}) - "
                f"({organization_name}) - "
                f"{data['title']}"
            ),
            tx_hash=result["tx_hash"],
            from_address=result.get(
                "from_address"
            ),
            status="success",
            created_at=datetime.now(timezone.utc)
        )

        db.add(transaction_record)
        db.commit()

        # =====================================================
        # SAVE ELECTION NOTIFICATION
        # =====================================================

        try:
            notification = ElectionNotification(
                institution_id=int(
                    data["institution_id"]
                ),
                organization_id=int(
                    data["organization_id"]
                ),
                title=data["title"],
                min_candidate_age=int(
                    data["min_candidate_age"]
                ),
                max_candidate_age=int(
                    data["max_candidate_age"]
                ),
                candidate_registration_start=int(
                    data["candidate_registration_start"]
                ),
                candidate_registration_end=int(
                    data["candidate_registration_end"]
                ),
                voting_start=int(
                    data["voting_start"]
                ),
                voting_end=int(
                    data["voting_end"]
                ),
                candidate_email_sent=False,
                voting_email_sent=False,
                created_at=datetime.now(timezone.utc)
            )

            db.add(notification)
            db.commit()
            db.refresh(notification)

            eligible_users = get_candidate_eligible_voters(
                db,
                int(data["min_candidate_age"]),
                int(data["max_candidate_age"])
            )

            registration_end = datetime.fromtimestamp(
                int(data["candidate_registration_end"])
            ).strftime(
                "%d %b %Y, %I:%M %p"
            )

            for voter in eligible_users:
                try:
                    send_election_email(
                        to_email=voter.email,
                        full_name=voter.full_name,
                        subject=(
                            f"EVoTE - Candidate Opportunity: "
                            f"{data['title']}"
                        ),
                        heading="You Are Eligible to Apply",
                        message_text=(
                            f"A new election post "
                            f"\"{data['title']}\" has been created.\n\n"
                            f"Candidate age requirement: "
                            f"{data['min_candidate_age']} - "
                            f"{data['max_candidate_age']} years.\n\n"
                            f"Based on your registered date of birth, "
                            f"you meet the age requirement to apply "
                            f"as a candidate.\n\n"
                            f"Candidate registration closes: "
                            f"{registration_end}.\n\n"
                            f"Log in to EVoTE and open "
                            f"Request Candidate if you want to apply."
                        )
                    )

                except Exception as email_error:
                    print(
                        f"Candidate email failed for "
                        f"{voter.email}: {email_error}"
                    )

            notification.candidate_email_sent = True
            db.commit()

            print(
                f"Candidate notification processed for "
                f"{len(eligible_users)} eligible voter(s)."
            )

        except Exception as notification_error:
            print(
                "Election notification error:",
                notification_error
            )

        return result

    except HTTPException:
        raise

    except Exception as error:
        raise HTTPException(
            status_code=400,
            detail=str(error)
        )


@app.post("/blockchain/approve-candidate-request")
def approve_candidate_request_chain(data: dict):
    result = approve_candidate_request_blockchain(
        int(data["institution_id"]),
        int(data["organization_id"]),
        int(data["post_id"]),
        int(data["request_id"]),
        data.get("full_name", "Admin"),
        data.get("email", "admin@evote.local")
    )

    return result


@app.post("/blockchain/reject-candidate-request")
def reject_candidate_request_chain(data: dict):
    result = reject_candidate_request_blockchain(
        int(data["institution_id"]),
        int(data["organization_id"]),
        int(data["post_id"]),
        int(data["request_id"]),
        data.get("full_name", "Admin"),
        data.get("email", "admin@evote.local")
    )

    return result


@app.post("/blockchain/vote")
def vote_chain(data: dict):
    result = vote_blockchain(
        int(data["institution_id"]),
        int(data["organization_id"]),
        int(data["post_id"]),
        int(data["candidate_id"]),
        data.get("full_name", "Voter"),
        data.get("email", "voter@evote.local")
    )

    return result


@app.post("/blockchain/request-candidate")
def request_candidate_chain(data: dict):
    result = request_candidate_blockchain(
        int(data["institution_id"]),
        int(data["organization_id"]),
        int(data["post_id"]),
        data["name"],
        data.get("full_name", data["name"]),
        data.get("email", "voter@evote.local")
    )

    return result