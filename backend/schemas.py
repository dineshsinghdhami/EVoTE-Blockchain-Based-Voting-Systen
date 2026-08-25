from pydantic import BaseModel, EmailStr


class UserCreate(BaseModel):
    username: str
    full_name: str
    email: EmailStr
    phone: str
    password: str
    confirm_password: str


class UserLogin(BaseModel):
    username_or_email: str
    password: str

class VerifyRegisterOTP(BaseModel):
    email: EmailStr
    otp: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResendOTP(BaseModel):
    email: EmailStr

class ResetPasswordVerify(BaseModel):
    email: EmailStr
    otp: str
    new_password: str
    confirm_password: str    

class CandidateRequestCreate(BaseModel):
    institution_id: int
    organization_id: int
    election_id: int


class VoteCreate(BaseModel):
    institution_id: int
    election_id: int
    candidate_id: int
    tx_hash: str


class CandidateProfileCreate(BaseModel):
    institution_id: int
    election_id: int
    candidate_id: int
    name: str
    department: str | None = None
    semester: str | None = None
    bio: str | None = None
    agenda: str | None = None
    photo: str | None = None    

# ============================================================
# METAMASK AUTHENTICATION SCHEMAS
# ============================================================

class WalletNonceRequest(BaseModel):
    wallet_address: str
    session_key: str | None = None


class WalletVerifyRequest(BaseModel):
    wallet_address: str
    signature: str


class MetaMaskRegisterRequest(BaseModel):
    wallet_address: str
    signature: str
    full_name: str
    email: EmailStr
    phone: str
    date_of_birth: str


class MetaMaskRegisterOTPVerify(BaseModel):
    email: EmailStr
    otp: str


class GaslessRequestPrepare(BaseModel):
    wallet_address: str
    action: str

    institution_id: int | None = None
    organization_id: int | None = None
    post_id: int | None = None
    candidate_id: int | None = None

    full_name: str | None = None
    date_of_birth: int | None = None


class GaslessRelayRequest(BaseModel):
    from_address: str
    to_address: str
    value: int
    gas: int
    deadline: int
    data: str
    signature: str
    