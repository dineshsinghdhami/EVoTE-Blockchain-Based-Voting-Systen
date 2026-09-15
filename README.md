# # EVoTE : Blockchain-Based Voting System

![License](https://img.shields.io/badge/license-Proprietary-red)
![Python](https://img.shields.io/badge/Python-Backend-blue)
![FastAPI](https://img.shields.io/badge/FastAPI-Web%20Framework-009688)
![React](https://img.shields.io/badge/React-Frontend-61DAFB)
![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-4169E1)
![Solidity](https://img.shields.io/badge/Solidity-Smart%20Contracts-363636)
![Ethereum](https://img.shields.io/badge/Ethereum-Sepolia-627EEA)

**EVoTE** is a blockchain-based voting system that I developed as my **Final-Year Computer Engineering project**.

I built it using **React, FastAPI, PostgreSQL, Solidity, and Ethereum** to manage elections, candidate applications, wallet authentication, voting, and election results. Voting transactions are recorded on the **Ethereum Sepolia testnet**.

> **Note:** This project is proprietary. Copying, modification, redistribution, or reuse requires prior written permission. See [LICENSE.md](LICENSE.md).

---

## # Features

* MetaMask wallet registration and login
* Wallet signature verification with JWT authentication
* Voter, Admin, and SuperAdmin roles
* Institution, organization, and election management
* Candidate registration and admin approval
* Candidate age and registration restrictions
* Scheduled registration and voting periods
* Multiple election seats and vote limits
* Duplicate-vote prevention
* Gasless voting using a backend relayer
* Authorized session keys
* Election result charts
* Blockchain transaction history and Etherscan links
* Admin and voter dashboards

---

## # Tech Stack

* **Frontend:** React, Vite, Material UI, Recharts
* **Backend:** Python, FastAPI
* **Database:** PostgreSQL, SQLAlchemy
* **Smart Contracts:** Solidity, OpenZeppelin
* **Blockchain Development:** Hardhat
* **Network:** Ethereum Sepolia
* **Wallet:** MetaMask
* **Integration:** ethers.js, Web3.py

---

## # Project Structure

| Path          | Purpose                                            |
| ------------- | -------------------------------------------------- |
| `frontend/`   | React UI, dashboards, and wallet integration       |
| `backend/`    | APIs, authentication, database, relayer, and tests |
| `blockchain/` | Smart contracts, deployment scripts, and tests     |
| `LICENSE.md`  | Licensing terms                                    |

---

## # Voting Workflow

1. Register and log in using MetaMask.
2. Select an institution, organization, and election.
3. Review available candidates.
4. Cast votes within the allowed seat limit.
5. The backend relays the signed transaction to the smart contract.
6. View results after the voting period closes.

---

## # Academic Context

I developed EVoTE at the **National Academy of Science and Technology (NAST), affiliated with Pokhara University**.

Through this project, I worked with:

* Full-stack development
* Wallet-based authentication
* Role-based access control
* Solidity smart contracts
* PostgreSQL integration
* Gasless blockchain transactions
* Backend and smart-contract testing

EVoTE is an academic prototype running on the Ethereum Sepolia testnet.

---

## # What I Learned

Building EVoTE gave me practical experience in combining **full-stack development with blockchain technology**.

Through this project, I improved my understanding of:

* Full-stack application development
* REST APIs with FastAPI
* PostgreSQL database management
* React application development
* Secure authentication and wallet signatures
* MetaMask integration
* Solidity smart-contract development
* Ethereum integration
* Backend-relayed and gasless transactions
* Election rules and validation
* Backend and smart-contract testing

One of the most interesting parts of the project was connecting the **React frontend, FastAPI backend, PostgreSQL database, MetaMask wallet, and Ethereum smart contracts** into one working system.

---

## # License

This project is **proprietary**, with **all rights reserved**.

Reuse, modification, redistribution, publishing, or hosting requires prior written permission. See [LICENSE.md](LICENSE.md) for details.

Third-party libraries and dependencies retain their respective licenses.

---

## # Contributions

Public contributions are not currently accepted.

For collaboration, educational use, research discussion, or licensing inquiries, feel free to contact me.

---

## # Author

**Dinesh Singh Dhami**

* **Website:** [dineshsinghdhami.com.np](https://dineshsinghdhami.com.np/)
* **GitHub:** [dineshsinghdhami](https://github.com/dineshsinghdhami)
* **Email:** [dineshdhamidn@gmail.com](mailto:dineshdhamidn@gmail.com)
