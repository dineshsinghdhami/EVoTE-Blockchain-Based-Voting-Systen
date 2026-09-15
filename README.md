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

EVoTE was submitted as a **Final-Year Computer Engineering group project** at the **National Academy of Science and Technology (NAST), affiliated with Pokhara University**.

The official project team consisted of:

* **Dinesh Singh Dhami** : 22070203
* **Dilli Raj Bhatta** : 22070202
* **Dipak Shyada** : 22070205
* **Samir Bist** : 22070230

---

## # My Contribution

I am **Dinesh Singh Dhami**, and I personally carried out the complete development of EVoTE from the beginning of the project to its final submission.

Although the project was officially submitted as a four-member group project, the complete practical and technical work was carried out by me.

My work included:

* Project planning, requirement analysis, and system design
* Frontend, backend, database, and dashboard development
* MetaMask, JWT, and wallet-based authentication
* Solidity smart contracts and Ethereum Sepolia integration
* Backend relayer, gasless transactions, and election validation logic
* Candidate registration and complete voting workflow
* Testing, debugging, and full system integration
* Project documentation, diagrams, final report, and README
* Final presentation/PPT and submission preparation

In short, I handled the **complete project lifecycle - from planning and implementation to testing, documentation, presentation, and final submission**.

I also used **AI tools as development assistants** for brainstorming, debugging support, code explanations, and documentation refinement. I reviewed, modified, tested, and integrated the final implementation myself.

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

The EVoTE project is publicly visible for **demonstration, evaluation, and portfolio purposes**, not for unrestricted reuse.

Do not assume that publicly accessible source code is free to copy, modify, republish, or redistribute.

If you wish to use any original part of this project, **request permission first**.

Third-party libraries and dependencies retain their respective licenses.

---

## # Contributions

Public contributions are not currently accepted.

For collaboration, educational use, research discussion, or licensing inquiries, feel free to contact me.

---

## # Project Owner

**Dinesh Singh Dhami**

* **Website:** [dineshsinghdhami.com.np](https://dineshsinghdhami.com.np/)
* **GitHub:** [dineshsinghdhami](https://github.com/dineshsinghdhami)
* **Email:** [dineshdhamidn@gmail.com](mailto:dineshdhamidn@gmail.com)
