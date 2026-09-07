# # EVoTE — Blockchain-Based Transparent Voting System

EVoTE is a full-stack electronic voting platform that combines a **React + Vite** frontend, **FastAPI + PostgreSQL** backend, and **Ethereum smart contracts** to provide transparent, tamper-resistant election workflows.

The current project is configured around the **Ethereum Sepolia testnet** and supports **MetaMask wallet authentication**, role-based access, institution/organization election management, candidate registration, blockchain voting, transaction history, and gasless/relayed blockchain operations.

> **Academic project:** This repository is intended for learning, demonstration, and final-year project use. It has not been independently security-audited and should not be used for real public elections without substantial security, privacy, legal, and operational review.

---

## # Current Features

### # Voter

- MetaMask wallet-based registration and authentication
- Wallet nonce/signature verification
- OTP-assisted registration flow
- User profile and profile photo
- Browse institutions, organizations, elections/posts, and candidates
- Candidate application/registration workflow
- Candidate eligibility checks, including configured age limits
- Cast votes through the blockchain voting contract
- Session-key and relayed transaction support
- View election results when the smart contract makes them available
- View personal blockchain/application transaction history

### # Admin

- Admin dashboard
- Institution and organization management
- Election/post management
- Candidate request review and approval/rejection
- Candidate management
- User management
- Results and transaction views
- Admin profile

### # Blockchain

- Solidity `Voting` smart contract
- OpenZeppelin `ERC2771Context` trusted-forwarder support
- `EVoTEForwarder` based on OpenZeppelin `ERC2771Forwarder`
- Ethereum Sepolia configuration (`chainId: 11155111`)
- On-chain users and roles
- Institutions → organizations → election posts hierarchy
- Candidate registration rules and limits
- Blockchain-enforced candidate registration and voting periods
- Vote tracking and replay-protection nonces
- Session-key authorization/revocation
- Smart-contract events for important voting-system actions
- Relayer-assisted/gasless transaction flows

---

## # Architecture

```text
┌──────────────────────────────────────────────┐
│             React + Vite Frontend            │
│ MetaMask • ethers.js • Axios • MUI • Charts │
└──────────────────────┬───────────────────────┘
                       │ HTTP / Wallet Signatures
                       ▼
┌──────────────────────────────────────────────┐
│               FastAPI Backend                │
│ Auth • OTP • Relayer • Uploads • API Logic  │
└───────────────┬──────────────────┬───────────┘
                │                  │ Web3
                ▼                  ▼
┌──────────────────────┐   ┌─────────────────────────┐
│      PostgreSQL      │   │    Ethereum Sepolia    │
│ Users • Requests     │   │ Voting.sol             │
│ Votes • Tx History   │   │ EVoTEForwarder.sol     │
└──────────────────────┘   └─────────────────────────┘
```

The database stores application metadata and supporting records, while critical voting rules and vote state are enforced by the smart contract.

---

## # Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | React 19, Vite 8, React Router, Axios, ethers.js 6, Material UI, Recharts, Day.js |
| Backend | Python, FastAPI, Uvicorn, SQLAlchemy, Pydantic, Web3.py, eth-account |
| Database | PostgreSQL |
| Blockchain | Solidity 0.8.24, Hardhat, OpenZeppelin Contracts, ethers.js |
| Network | Ethereum Sepolia |
| Wallet | MetaMask |
| Authentication | Wallet nonce/signature authentication, JWT, OTP-related flows |
| Testing | Pytest backend tests, Hardhat scripts |

---

## # Project Structure

```text
blockchain-voting-system/
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── contract/
│   │   ├── layouts/
│   │   ├── pages/
│   │   │   ├── admin/
│   │   │   └── user/
│   │   ├── App.jsx
│   │   ├── config.js
│   │   └── main.jsx
│   ├── .env
│   ├── package.json
│   └── vite.config.js
│
├── backend/
│   ├── tests/
│   ├── uploads/
│   ├── auth.py
│   ├── blockchain.py
│   ├── database.py
│   ├── main.py
│   ├── models.py
│   ├── schemas.py
│   ├── requirements.txt
│   └── .env
│
├── blockchain/
│   ├── contracts/
│   │   ├── Voting.sol
│   │   └── EVoTEForwarder.sol
│   ├── scripts/
│   ├── artifacts/
│   ├── hardhat.config.js
│   ├── package.json
│   └── .env
│
├── README.md
└── package.json
```

---

## 🔐 Environment Variables

Do **not** commit real secrets, private keys, database passwords, email app passwords, or JWT secrets.

### Backend — `backend/.env`

```env
DATABASE_URL=postgresql://USERNAME:PASSWORD@localhost:5432/DATABASE_NAME
SECRET_KEY=replace_with_a_strong_secret
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60

EMAIL_USER=your_email@example.com
EMAIL_PASS=your_email_app_password

SEPOLIA_RPC_URL=https://your-sepolia-rpc-url
RELAYER_PRIVATE_KEY=your_relayer_private_key
FORWARDER_CONTRACT_ADDRESS=0x...
VOTING_CONTRACT_ADDRESS=0x...
```

### Frontend — `frontend/.env`

```env
VITE_API_URL=http://127.0.0.1:8000
```

### Blockchain — `blockchain/.env`

```env
SEPOLIA_RPC_URL=https://your-sepolia-rpc-url
SEPOLIA_PRIVATE_KEY=your_deployer_private_key
FORWARDER_CONTRACT_ADDRESS=0x...
VOTING_CONTRACT_ADDRESS=0x...
```

> The uploaded project currently contains `.env` files. Before publishing the repository, make sure they are ignored by Git and rotate any credentials/private keys that have ever been exposed.

---

## ⚙️ Prerequisites

Install:

- **Python 3.10+**
- **Node.js + npm**
- **PostgreSQL**
- **MetaMask**
- A **Sepolia RPC endpoint**
- Sepolia test ETH for deployment/relayer operations

---

## 🚀 Installation and Setup

### 1. Clone the repository

```bash
git clone https://github.com/dineshsinghdhami/EVoTE.git
cd EVoTE
```

If your local folder has a different name, enter that folder instead.

### 2. Set up PostgreSQL

Create a PostgreSQL database for EVoTE and put its connection URL in `backend/.env` as `DATABASE_URL`.

Example:

```env
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/evote
```

### 3. Set up the backend

From the project root:

```bash
cd backend
python -m venv venv
```

Activate the environment.

**Windows:**

```bash
venv\Scripts\activate
```

**macOS/Linux:**

```bash
source venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Configure `backend/.env`, then run:

```bash
uvicorn main:app --reload
```

Backend:

```text
http://127.0.0.1:8000
```

FastAPI interactive API documentation:

```text
http://127.0.0.1:8000/docs
```

### 4. Set up the frontend

Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Vite will display the local frontend URL, typically:

```text
http://localhost:5173
```

Make sure `frontend/.env` points to the backend:

```env
VITE_API_URL=http://127.0.0.1:8000
```

### 5. Install blockchain dependencies

Open another terminal:

```bash
cd blockchain
npm install
```

Compile the contracts:

```bash
npx hardhat compile
```

---

## ⛓️ Deploying to Sepolia

Configure `blockchain/.env`:

```env
SEPOLIA_RPC_URL=https://your-sepolia-rpc-url
SEPOLIA_PRIVATE_KEY=your_deployer_private_key
```

Deploy:

```bash
npx hardhat run scripts/deploy.js --network sepolia
```

The deployment script deploys:

1. `EVoTEForwarder`
2. `Voting`

It prints the forwarder address, voting-contract address, SuperAdmin wallet, and chain ID.

After deployment, update the relevant contract addresses in:

- `backend/.env`
- `blockchain/.env`
- `frontend/src/contract/contract.js`

The current frontend contract configuration expects **Sepolia chain ID `11155111`**.

---

## 🦊 MetaMask

1. Install MetaMask.
2. Select or add the **Sepolia** network.
3. Use a test wallet only.
4. Fund the required deployment/relayer wallet with Sepolia test ETH.
5. Connect the wallet from EVoTE.
6. Approve only signatures/transactions you understand.

Never place a MetaMask seed phrase or production wallet private key in this project.

---

## ▶️ Quick Run

Use separate terminals.

**Terminal 1 — Backend**

```bash
cd backend
uvicorn main:app --reload
```

**Terminal 2 — Frontend**

```bash
cd frontend
npm run dev
```

The normal Sepolia-based workflow does not require running a local Hardhat node.

For local smart-contract development, you can run:

```bash
cd blockchain
npx hardhat node
```

and deploy to an appropriately configured local Hardhat network.

---

## 🧪 Testing

### Backend

From `backend/`:

```bash
python -m pytest tests -v
```

### Smart-contract utility/test scripts

The `blockchain/scripts/` directory contains scripts for deployment and development checks, including Sepolia verification, wallet checks, deployment estimation, voting tests, and gasless transaction tests.

Examples:

```bash
npx hardhat run scripts/checkSepolia.js --network sepolia
npx hardhat run scripts/verifySepoliaDeployment.js --network sepolia
```

Review each script and its required environment variables before running it.

---

## 🗃️ Main Backend Data Models

The inspected backend currently defines application models including:

- `User`
- `CandidateRequest`
- `VoteRecord`
- `TransactionHistory`
- `CandidateProfile`
- `WalletNonce`
- `PendingWalletRegistration`
- `ElectionNotification`

These complement the state stored in the Solidity voting contract.

---

## 🔗 Important API Areas

The FastAPI application includes endpoints for:

- MetaMask nonce generation and signature verification
- Wallet registration and OTP verification
- Candidate registration preparation and relay
- Vote preparation and relay
- Session-relayed voting/candidate operations
- User and candidate-request management
- Candidate approval/rejection
- Vote and transaction records
- Profile/candidate image uploads
- Blockchain institution, organization, post, candidate, and voting operations
- Blockchain connectivity testing

Use the generated Swagger UI at `/docs` for the exact current request/response schemas.

---

## 🧠 Smart Contract Model

The `Voting` contract defines four roles:

```text
None
Voter
Admin
SuperAdmin
```

Its election hierarchy is:

```text
Institution
└── Organization
    └── Post / Election
        └── Candidates
            └── Votes
```

Each post can define:

- Number of winner seats
- Maximum candidate count
- Minimum and maximum candidate age
- Candidate registration start/end
- Voting start/end

The contract also maintains voter/candidate nonces and session-key authorization to protect signed operations from replay.

---

## 🔒 Security Notes

The project already uses several security-oriented mechanisms, including wallet signatures, nonces, role checks, blockchain-enforced time windows, OpenZeppelin meta-transaction components, password hashing/JWT support in the backend, and environment-based secrets.

Before any real-world deployment:

- Remove secrets from Git history and rotate exposed credentials.
- Never use development/deployer private keys for production.
- Perform an independent smart-contract security audit.
- Add comprehensive contract and API tests.
- Review authorization on every admin/backend endpoint.
- Apply rate limiting and abuse protection to authentication/OTP endpoints.
- Harden CORS and production server configuration.
- Store uploads securely and validate file type/size.
- Use HTTPS.
- Back up and secure PostgreSQL.
- Define election governance, identity verification, privacy, dispute, and recovery procedures.
- Consider voter secrecy requirements: blockchain transparency alone does not guarantee ballot anonymity.

---

## ⚠️ Current Project Notes

Based on the current repository:

- The active Hardhat configuration targets **Ethereum Sepolia**.
- Solidity is configured for **0.8.24** with optimizer and `viaIR`.
- The frontend uses **Vite**, so the correct development command is `npm run dev`, not `npm start`.
- Gasless/relayed flows are implemented using an OpenZeppelin trusted forwarder plus backend relayer/session-key logic.
- Generated `artifacts/`, frontend `dist/`, uploaded profile/candidate images, cache folders, and `.env` files are present in the supplied project. Review what should actually be committed before publishing.
- Some legacy password/OTP endpoints coexist with the newer MetaMask wallet flow.
- This is a prototype/academic system, not a production election platform.

---

## 🔮 Suggested Future Improvements

- Full automated smart-contract test suite
- Independent contract security audit
- Stronger ballot privacy/anonymity design
- Production-grade secrets management
- Docker/Docker Compose setup
- Database migrations managed consistently with Alembic
- CI/CD pipeline
- More extensive backend integration tests
- Frontend component/unit tests
- Formal deployment documentation
- Monitoring and structured logging
- Accessibility and mobile usability review

---

## 🎓 Educational Objectives

EVoTE demonstrates:

- Full-stack Web3 application development
- MetaMask wallet authentication
- Ethereum smart-contract integration
- Role-based election administration
- FastAPI REST API development
- PostgreSQL persistence with SQLAlchemy
- Solidity election rules
- Trusted-forwarder/meta-transaction concepts
- Blockchain transaction tracking and auditability

---

## 👨‍💻 Developer

**Dinesh Singh Dhami**

Bachelor of Computer Engineering (BE)  
Final-Year Project — Blockchain-Based Voting System

- Website: https://dineshsinghdhami.com.np
- GitHub: https://github.com/dineshsinghdhami
- LinkedIn: https://www.linkedin.com/in/dineshsinghdhami2

---

## 🔒 Copyright & Usage Restrictions

**© 2026 Dinesh Singh Dhami. All Rights Reserved.**

**EVoTE — Blockchain-Based Transparent and Tamper-Resistant Voting System** is the sole intellectual work and property of **Dinesh Singh Dhami**.

This project is **proprietary and not open source**. No permission is granted to copy, reproduce, modify, distribute, publish, sublicense, sell, reuse, or create derivative works from this project, in whole or in part, without prior written permission from the copyright owner.

The source code, smart contracts, frontend, backend, database design, documentation, project materials, and other associated resources are provided for viewing and evaluation purposes only.

Unauthorized copying, reuse, redistribution, publication, modification, commercial use, or representation of this project as another person's work is prohibited.

**All rights are reserved by Dinesh Singh Dhami.**

> **Note:** This copyright notice protects the project's original code, documentation, design, and other copyrightable material. It does not by itself grant exclusive ownership over general concepts or ideas such as blockchain-based electronic voting.

---

**EVoTE — Transparent voting backed by verifiable blockchain rules.**
