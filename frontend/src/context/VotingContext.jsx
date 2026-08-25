import { API_URL } from "../config";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { ethers } from "ethers";
import axios from "axios";



import {
  CONTRACT_ADDRESS,
  CONTRACT_ABI,
} from "../contract/contract";

const VotingContext = createContext(null);


const SEPOLIA_CHAIN_ID = "0xaa36a7";


function getFriendlyApiError(
  err,
  fallback = "Something went wrong."
) {
  if (!err?.response) {
    return (
      "EVoTE is currently unavailable. " +
      "The request could not be completed. " +
      "try again."
    );
  }

  return (
    err?.response?.data?.detail ||
    fallback
  );
}

export function VotingProvider({ children }) {
  const savedUser = JSON.parse(
    localStorage.getItem("user")
  );

  const [user, setUser] =
    useState(savedUser);

  const [account, setAccount] =
    useState("");

  const [message, setMessage] =
    useState("");

  const [
    errorModal,
    setErrorModal,
  ] = useState(null);

  const walletMismatch =
    user?.wallet_address &&
    account &&
    user.wallet_address.toLowerCase() !==
      account.toLowerCase();


  // =====================================================
  // GLOBAL BACKEND ERROR POPUP
  // =====================================================

  const handleApiError = useCallback(
    (
      err,
      fallback = "Something went wrong."
    ) => {
      const friendlyMessage =
        getFriendlyApiError(
          err,
          fallback
        );

      if (!err?.response) {
        setMessage("");

        setErrorModal({
          title:
            "EVoTE Backend Unavailable",

          message:
            friendlyMessage,
        });
      } else {
        setMessage(
          friendlyMessage
        );
      }

      return friendlyMessage;
    },
    []
  );


  const closeErrorModal = useCallback(
    () => {
      setErrorModal(null);
    },
    []
  );


  // =====================================================
  // TRANSACTIONS
  // =====================================================

  const [
    transactions,
    setTransactions,
  ] = useState([]);

  const [
    transactionError,
    setTransactionError,
  ] = useState("");

  const [
    transactionsLoading,
    setTransactionsLoading,
  ] = useState(false);


  // =====================================================
  // OTHER STATE
  // =====================================================

  const [
    institutionCount,
    setInstitutionCount,
  ] = useState(0);

  const [
  institutionCountLoading,
  setInstitutionCountLoading,
] = useState(false);

  const [
    activeElections,
    setActiveElections,
  ] = useState([]);

  const [
    activeElectionsLoading,
    setActiveElectionsLoading,
  ] = useState(false);


  // =====================================================
  // PROFILE IMAGE
  // =====================================================

  const profileImage =
    user?.profile_picture
      ? `${API_URL}/${user.profile_picture}`
      : null;


  // =====================================================
  // CONTRACT
  // =====================================================

  const getContract =
    useCallback(async () => {
      if (!window.ethereum) {
        setMessage(
          "Please install MetaMask to use blockchain features."
        );

        return null;
      }

      try {
        const chainId =
          await window.ethereum.request({
            method: "eth_chainId",
          });

        if (
          chainId !==
          SEPOLIA_CHAIN_ID
        ) {
          setMessage(
            "Please switch MetaMask to Sepolia Testnet."
          );

          return null;
        }

        const provider =
          new ethers.BrowserProvider(
            window.ethereum
          );

        const signer =
          await provider.getSigner();

        return new ethers.Contract(
          CONTRACT_ADDRESS,
          CONTRACT_ABI,
          signer
        );
      } catch (err) {
        console.error(
          "Failed to create contract:",
          err
        );

        setMessage(
          err?.message ||
            "Failed to connect to the voting contract."
        );

        return null;
      }
    }, []);


  // =====================================================
  // CONNECT WALLET
  // =====================================================

  const connectWallet =
    useCallback(async () => {
      if (!window.ethereum) {
        setMessage(
          "Please install MetaMask to use blockchain features."
        );

        return;
      }

      try {
        const currentChainId =
          await window.ethereum.request({
            method: "eth_chainId",
          });

        if (
          currentChainId !==
          SEPOLIA_CHAIN_ID
        ) {
          setMessage(
            "Switching MetaMask to Sepolia Testnet..."
          );

          await window.ethereum.request({
            method:
              "wallet_switchEthereumChain",

            params: [
              {
                chainId:
                  SEPOLIA_CHAIN_ID,
              },
            ],
          });
        }

        const accounts =
          await window.ethereum.request({
            method:
              "eth_requestAccounts",
          });

        if (
          accounts.length > 0
        ) {
          setAccount(
            accounts[0]
          );

          localStorage.setItem(
            "walletAddress",
            accounts[0]
          );

          setMessage("");
        }
      } catch (err) {
        console.error(
          "Wallet connection failed:",
          err
        );

        if (
          err?.code === 4001
        ) {
          setMessage(
            "MetaMask request was cancelled."
          );
        } else {
          setMessage(
            err?.message ||
              "Failed to connect wallet."
          );
        }
      }
    }, []);


  // =====================================================
  // CHECK WALLET
  // =====================================================

  const checkWalletConnected =
    useCallback(async () => {
      if (!window.ethereum) {
        setAccount("");

        return;
      }

      try {
        const accounts =
          await window.ethereum.request({
            method:
              "eth_accounts",
          });

        if (
          accounts.length > 0
        ) {
          setAccount(
            accounts[0]
          );

          localStorage.setItem(
            "walletAddress",
            accounts[0]
          );
        } else {
          setAccount("");

          localStorage.removeItem(
            "walletAddress"
          );
        }
      } catch (err) {
        console.error(
          "Failed to check wallet connection:",
          err
        );

        setAccount("");
      }
    }, []);


  // =====================================================
  // LOAD USER PROFILE
  // =====================================================

  const loadUserProfile =
    useCallback(async () => {
      try {
        if (
          !savedUser?.id
        ) {
          return;
        }

        const token =
          localStorage.getItem(
            "access_token"
          ) ||
          localStorage.getItem(
            "token"
          );

        if (!token) {
          return;
        }

        const res =
          await axios.get(
            `${API_URL}/user/${savedUser.id}`,
            {
              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            }
          );

        setUser(
          res.data
        );

        localStorage.setItem(
          "user",
          JSON.stringify(
            res.data
          )
        );
      } catch (err) {
        console.error(
          "Failed to load user profile:",
          err
        );

        handleApiError(
          err,
          "Failed to load user profile."
        );
      }

      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [handleApiError]);


  // =====================================================
  // LOAD TRANSACTIONS
  // =====================================================

  const loadTransactions =
    useCallback(async () => {
      if (!user?.id) {
        setTransactions([]);
        setTransactionError("");

        return [];
      }

      const token =
        localStorage.getItem(
          "access_token"
        ) ||
        localStorage.getItem(
          "token"
        );

      if (!token) {
        setTransactionError(
          "Your login session is unavailable. Please log in again."
        );

        return [];
      }

      setTransactionsLoading(true);

      try {
        const res =
          await axios.get(
            `${API_URL}/transactions/user/${user.id}`,
            {
              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            }
          );

        const data =
          Array.isArray(
            res.data
          )
            ? res.data
            : [];

        setTransactions(
          data
        );

        setTransactionError("");

        return data;

      } catch (err) {
        console.error(
          "Failed to load transactions:",
          err
        );


        // -------------------------------------------------
        // IMPORTANT:
        // Do not erase transactions that were already loaded.
        // A temporary backend outage does not mean the
        // blockchain transaction history disappeared.
        // -------------------------------------------------

        if (!err?.response) {
          setTransactionError(
            "The EVoTE backend is currently unavailable. Your blockchain transactions remain recorded on Ethereum Sepolia."
          );
        } else {
          setTransactionError(
            err?.response?.data?.detail ||
              "Transaction history could not be loaded right now. Your blockchain records remain on Ethereum Sepolia."
          );
        }

        return null;

      } finally {
        setTransactionsLoading(
          false
        );
      }
    }, [user?.id]);


  // =====================================================
  // CLEAR TRANSACTION ERROR
  // =====================================================

  const clearTransactionError =
    useCallback(() => {
      setTransactionError("");
    }, []);


  // =====================================================
  // LOAD INSTITUTION COUNT
  // =====================================================

  const loadInstitutionCount =
  useCallback(async () => {
    setInstitutionCountLoading(true);

    try {
      const contract =
        await getContract();

      if (!contract) {
        return;
      }

      const count =
        Number(
          await contract.institutionCount()
        );

      setInstitutionCount(
        count
      );

    } catch {
      /* silent on overview */

    } finally {
      setInstitutionCountLoading(false);
    }
  }, [getContract]);


  // =====================================================
  // LOAD ACTIVE ELECTIONS
  // =====================================================

  const loadActiveElections =
    useCallback(async () => {
      setActiveElectionsLoading(
        true
      );

      try {
        const contract =
          await getContract();

        if (!contract) {
          setActiveElections([]);

          return;
        }

        const institutionTotal =
          Number(
            await contract.institutionCount()
          );

        const elections = [];

        const now =
          Math.floor(
            Date.now() / 1000
          );


        // -------------------------------------------------
        // LOOP INSTITUTIONS
        // -------------------------------------------------

        for (
          let institutionId = 1;
          institutionId <=
          institutionTotal;
          institutionId++
        ) {
          const institution =
            await contract.institutions(
              institutionId
            );

          const institutionName =
            institution.name;

          const organizationCount =
            Number(
              institution.organizationCount
            );


          // -----------------------------------------------
          // LOOP ORGANIZATIONS
          // -----------------------------------------------

          for (
            let organizationId = 1;
            organizationId <=
            organizationCount;
            organizationId++
          ) {
            const organization =
              await contract.getOrganization(
                institutionId,
                organizationId
              );

            const organizationName =
              organization[1];

            const organizationExists =
              organization[2];

            const postCount =
              Number(
                organization[3]
              );

            if (
              !organizationExists
            ) {
              continue;
            }


            // ---------------------------------------------
            // LOOP POSTS
            // ---------------------------------------------

            for (
              let postId = 1;
              postId <= postCount;
              postId++
            ) {
              const post =
                await contract.getPost(
                  institutionId,
                  organizationId,
                  postId
                );

              const actualPostId =
                Number(
                  post.id
                );

              const title =
                post.title;

              const postActive =
                Boolean(
                  post.active
                );

              const seatLimit =
                Number(
                  post.seatCount
                );

              const candidateCount =
                Number(
                  post.candidateCount
                );

              const startDate =
                Number(
                  post.votingStart
                );

              const endDate =
                Number(
                  post.votingEnd
                );

              const isActive =
                postActive &&
                startDate > 0 &&
                endDate > 0 &&
                now >=
                  startDate &&
                now <=
                  endDate;

              if (
                !isActive
              ) {
                continue;
              }

              elections.push({
                institutionId,
                institutionName,

                organizationId,
                organizationName,

                postId:
                  actualPostId,

                title,

                seatLimit,
                candidateCount,

                startDate,
                endDate,
              });
            }
          }
        }


        // -------------------------------------------------
        // ENDING SOON FIRST
        // -------------------------------------------------

        elections.sort(
          (a, b) =>
            a.endDate -
            b.endDate
        );

        setActiveElections(
          elections
        );

      } catch (err) {
        console.error(
          "Failed to load active elections:",
          err
        );

        setActiveElections([]);

      } finally {
        setActiveElectionsLoading(
          false
        );
      }
    }, [getContract]);


  // =====================================================
  // LOGOUT
  // =====================================================

  function logout() {
    localStorage.clear();

    window.location.href =
      "/";
  }


  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    async function init() {
      await checkWalletConnected();

      await loadUserProfile();
    }

    init();

    if (!window.ethereum) {
      return;
    }


    const handleAccountsChanged =
      (accounts) => {
        if (
          accounts.length === 0
        ) {
          setAccount("");

          localStorage.removeItem(
            "walletAddress"
          );

          setMessage(
            "MetaMask wallet disconnected."
          );

          return;
        }

        setAccount(
          accounts[0]
        );

        localStorage.setItem(
          "walletAddress",
          accounts[0]
        );

        setMessage("");
      };


    const handleChainChanged =
      (chainId) => {
        if (
          chainId !==
          SEPOLIA_CHAIN_ID
        ) {
          setMessage(
            "Please switch MetaMask to Sepolia Testnet."
          );
        } else {
          setMessage("");
        }

        window.location.reload();
      };


    window.ethereum.on(
      "accountsChanged",
      handleAccountsChanged
    );

    window.ethereum.on(
      "chainChanged",
      handleChainChanged
    );


    return () => {
      window.ethereum.removeListener(
        "accountsChanged",
        handleAccountsChanged
      );

      window.ethereum.removeListener(
        "chainChanged",
        handleChainChanged
      );
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  // =====================================================
  // CONTEXT VALUES
  // =====================================================

  const value = {
    user,
    setUser,

    account,
    setAccount,

    message,
    setMessage,

    errorModal,
    closeErrorModal,
    handleApiError,

    walletMismatch,


    // TRANSACTION STATE

    transactions,

    transactionError,

    transactionsLoading,

    clearTransactionError,


    profileImage,

    institutionCount,
    institutionCountLoading,


    activeElections,
    activeElectionsLoading,


    getContract,

    connectWallet,
    checkWalletConnected,

    loadUserProfile,

    loadTransactions,

    loadInstitutionCount,

    loadActiveElections,

    logout,
  };


  return (
    <VotingContext.Provider
      value={value}
    >
      {children}

      {errorModal && (
        <div style={backendErrorOverlayStyle}>
          <div style={backendErrorModalStyle}>

            <div style={backendErrorIconStyle}>
              !
            </div>

            <h3
              style={{
                margin: "0 0 8px",
                color: "#f8fafc",
                fontSize: "17px",
                textAlign: "center",
              }}
            >
              {errorModal.title}
            </h3>

            <p
              style={{
                margin: "0 0 16px",
                color: "#cbd5e1",
                fontSize: "12px",
                lineHeight: "1.55",
                textAlign: "center",
              }}
            >
              {errorModal.message}
            </p>

            <div
              style={{
                padding: "8px 10px",
                marginBottom: "14px",
                borderRadius: "7px",
                border:
                  "1px solid rgba(245,158,11,0.25)",
                background:
                  "rgba(245,158,11,0.07)",
                color: "#fcd34d",
                fontSize: "11px",
                lineHeight: "1.45",
                textAlign: "center",
              }}
            >
              Please start the EVoTE backend and try again.
            </div>

            <button
              type="button"
              onClick={closeErrorModal}
              style={backendErrorCloseButtonStyle}
            >
              Close
            </button>

          </div>
        </div>
      )}
    </VotingContext.Provider>
  );
}



const backendErrorOverlayStyle = {
  position: "fixed",
  inset: 0,
  zIndex: 20000,

  display: "flex",
  alignItems: "center",
  justifyContent: "center",

  padding: "20px",

  background:
    "rgba(0,0,0,0.70)",

  backdropFilter:
    "blur(3px)",
};


const backendErrorModalStyle = {
  width: "100%",
  maxWidth: "340px",

  padding: "18px",

  borderRadius: "12px",

  border:
    "1px solid rgba(245,158,11,0.35)",

  background:
    "#202020",

  boxShadow:
    "0 18px 55px rgba(0,0,0,0.60)",
};


const backendErrorIconStyle = {
  width: "38px",
  height: "38px",

  margin:
    "0 auto 10px",

  borderRadius:
    "50%",

  display: "flex",
  alignItems: "center",
  justifyContent: "center",

  border:
    "1px solid rgba(245,158,11,0.40)",

  background:
    "rgba(245,158,11,0.12)",

  color:
    "#fbbf24",

  fontSize:
    "20px",

  fontWeight:
    "900",
};


const backendErrorCloseButtonStyle = {
  width: "100%",

  padding:
    "9px 12px",

  border:
    "none",

  borderRadius:
    "7px",

  background:
    "#1688a5",

  color:
    "#ffffff",

  fontSize:
    "12px",

  fontWeight:
    "800",

  cursor:
    "pointer",
};


export function useVoting() {
  const ctx =
    useContext(
      VotingContext
    );

  if (!ctx) {
    throw new Error(
      "useVoting must be used inside VotingProvider"
    );
  }

  return ctx;
}