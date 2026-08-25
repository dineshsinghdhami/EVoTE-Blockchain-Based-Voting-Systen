# 🗳️ VoteChain – Blockchain Based Voting System

A secure, transparent, and decentralized voting platform built using **React.js**, **FastAPI**, **PostgreSQL**, **Solidity**, **Ganache**, and **MetaMask**.

VoteChain combines traditional web technologies with blockchain to provide a tamper-resistant voting system where votes are permanently recorded on the Ethereum blockchain while user management and KYC verification are handled through a centralized backend.

---

# 🚀 Project Overview

Traditional electronic voting systems suffer from issues such as vote manipulation, lack of transparency, and centralized control.

VoteChain addresses these challenges by:

* Storing votes on the blockchain.
* Using Ethereum smart contracts for vote counting.
* Providing transparency and auditability.
* Preventing unauthorized voting.
* Integrating MetaMask for wallet-based transactions.
* Maintaining voter records through PostgreSQL.

---

# ✨ Features

## 👤 Voter Features

* User Registration
* User Login Authentication
* Profile Management
* KYC Document Submission
* MetaMask Wallet Connection
* View Available Elections
* Vote for Candidates
* Real-Time Election Results
* Blockchain Transaction Verification

---

## 🛠️ Admin Features

* Secure Admin Login
* Create Elections
* Manage Candidates
* Review KYC Requests
* Approve/Reject Voters
* Monitor Elections
* View Voting Statistics
* Manage User Accounts

---

## ⛓️ Blockchain Features

* Ethereum Smart Contract Voting
* Immutable Vote Records
* Transparent Vote Counting
* MetaMask Transaction Signing
* Ganache Local Blockchain Network
* Decentralized Vote Storage

---

# 🏗️ System Architecture

```text
Frontend (React.js)
        │
        ▼
Backend API (FastAPI)
        │
        ▼
 PostgreSQL Database
        │
        ▼
 Smart Contract (Solidity)
        │
        ▼
Ganache Blockchain
        │
        ▼
MetaMask Wallet
```

---

# 🛠️ Technology Stack

## Frontend

* React.js
* React Router DOM
* Axios
* Ethers.js
* CSS

## Backend

* FastAPI
* SQLAlchemy
* Pydantic
* Passlib (Bcrypt)

## Database

* PostgreSQL

## Blockchain

* Solidity
* Ganache
* MetaMask
* Ethers.js

---

# 📂 Project Structure

```text
blockchain-voting-system/

├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   ├── contract/
│   │   ├── components/
│   │   └── App.jsx
│
├── backend/
│   ├── main.py
│   ├── models.py
│   ├── schemas.py
│   ├── database.py
│   └── uploads/
│
├── blockchain/
│   ├── contracts/
│   │   └── Voting.sol
│   ├── scripts/
│   └── artifacts/
│
├── package.json
└── README.md
```

---

# ⚙️ Installation & Setup

## 1️⃣ Clone Repository

```bash
git clone https://github.com/dineshsinghdhami/EVoTE.git

cd blockchain-voting-system
```

---

# 🗄️ Backend Setup

## Create Virtual Environment

```bash
cd backend

python -m venv venv

venv\Scripts\activate
```

## Install Dependencies

```bash
pip install -r requirements.txt
```

## Configure PostgreSQL

Update your database credentials inside:

```python
database.py
```

Example:

```python
DATABASE_URL = "postgresql://postgres:your_password@localhost/votingdb"
```

## Run Backend

```bash
uvicorn main:app --reload
```

Backend URL:

```text
http://127.0.0.1:8000
```

---

# 💻 Frontend Setup

```bash
cd frontend

npm install

npm start
```

Frontend URL:

```text
http://localhost:3000
```

---

# ⛓️ Blockchain Setup (Ganache)

## Start Ganache

Open Ganache and create a local workspace.

Default settings:

```text
RPC Server:
http://127.0.0.1:7545

Chain ID:
1337
```

---

## Deploy Smart Contract

Compile contract:

```bash
npx hardhat compile
```

Deploy:

```bash
npx hardhat run scripts/deploy.js --network localhost
```

After deployment, copy the contract address.

Update:

```javascript
frontend/src/contract/contract.js
```

```javascript
export const CONTRACT_ADDRESS =
"YOUR_DEPLOYED_CONTRACT_ADDRESS";
```

---

# 🦊 MetaMask Setup

Add Ganache Network:

```text
Network Name: Ganache Local

RPC URL:
http://127.0.0.1:7545

Chain ID:
1337

Currency Symbol:
ETH
```

Import one Ganache account into MetaMask using its private key.

---

# 🔐 Security Measures

* Password Hashing using Bcrypt
* Protected API Endpoints
* KYC Verification Workflow
* Blockchain Vote Storage
* MetaMask Transaction Authentication
* Smart Contract Validation
* Immutable Vote Records

---

# ⚠️ Current Limitations

This project is currently a prototype and has some limitations:

* Local Ganache blockchain only
* No production deployment
* Limited KYC verification automation
* Smart contract requires further security auditing
* Advanced voter anonymity not implemented
* Scalability improvements required

---

# 🔮 Future Enhancements

* Sepolia Testnet Deployment
* Mobile Application
* OTP / MFA Authentication
* Facial Verification
* IPFS Document Storage
* Anonymous Voting Mechanism
* Smart Contract Security Audit
* Election Analytics Dashboard
* Multi-Admin Management

---

# 🎯 Educational Objectives

This project demonstrates:

* Blockchain Integration with Web Applications
* Smart Contract Development
* Decentralized Voting Concepts
* FastAPI Backend Development
* PostgreSQL Database Management
* MetaMask Authentication
* Ethereum Transaction Handling

---

# 👨‍💻 Developer

**Dinesh Singh Dhami**

Bachelor of Computer Engineering (BE)

Blockchain Based Voting System – Final Year Academic Project

Built using React, FastAPI, PostgreSQL, Solidity, Ganache, MetaMask, and Ethereum.