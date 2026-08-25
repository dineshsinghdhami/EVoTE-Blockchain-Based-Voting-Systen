import { API_URL } from "../config";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import axios from "axios";

import { ethers } from "ethers";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "../contract/contract";

export const AdminContext = createContext(null);
function getFriendlyApiError(
  err,
  fallback = "Something went wrong."
) {
  // Backend/server cannot be reached
  if (!err?.response) {
    return (
      "EVoTE is currently unavailable. " +
      "The transaction was not submitted to the blockchain. " +
      "try again."
    );
  }

  // Backend returned a proper error
  return (
    err?.response?.data?.detail ||
    fallback
  );
}

const RESULT_COLORS = [
  "#3b82f6",
  "#22c55e",
  "#f59e0b",
  "#8b5cf6",
  "#ef4444",
  "#14b8a6",
];

export function AdminProvider({ children }) {
  const [adminUser, setAdminUser] = useState(() => {
  try {
    return JSON.parse(
      localStorage.getItem("user")
    );
  } catch {
    return null;
  }
});

  const [account, setAccount] = useState("");
  const [message, setMessage] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);
  const [confirmBox, setConfirmBox] = useState(null);

  const [errorModal, setErrorModal] = useState(null);

  // Success/error messages (e.g. "Organization created successfully. Tx: ...")
  // must not sit on screen forever. Auto-dismiss a few seconds after each
  // new message is set.
  useEffect(() => {
    if (!message) return;

    const timer = setTimeout(() => {
      setMessage("");
    }, 6000);

    return () => clearTimeout(timer);
  }, [message]);

  const askConfirm = ({ title, message, confirmText = "Continue" }) => {
    return new Promise((resolve) => {
      setConfirmBox({
        title,
        message,
        confirmText,
        resolve,
      });
    });
  };

  const closeConfirm = (answer) => {
    confirmBox?.resolve(answer);
    setConfirmBox(null);
  };


  // =========================================================
  // FRIENDLY API ERROR HANDLER
  // =========================================================

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

      // No HTTP response means FastAPI/server could not
      // be reached at all. Show this as a popup instead
      // of putting "Network Error" in the global banner.
      if (!err?.response) {
        setMessage("");

        setErrorModal({
          title:
            "EVoTE Backend Unavailable",

          message:
            friendlyMessage,
        });
      } else {
        // Normal backend validation/application errors can
        // continue using the normal status banner.
        setMessage(
          friendlyMessage
        );
      }

      return friendlyMessage;
    },
    []
  );


  const closeErrorModal = () => {
    setErrorModal(null);
  };

  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);

  const [institutionName, setInstitutionName] = useState("");
  const [institutions, setInstitutions] = useState([]);
  const [institutionsLoading, setInstitutionsLoading] =
  useState(true);
  const [selectedInstitutionId, setSelectedInstitutionId] = useState("");

  const [organizationName, setOrganizationName] = useState("");
  const [organizations, setOrganizations] = useState([]);
  const [organizationsLoading, setOrganizationsLoading] =
    useState(false);
  const [selectedOrganizationId, setSelectedOrganizationId] = useState("");

  const [postTitle, setPostTitle] = useState("");

const [seatLimit, setSeatLimit] = useState("");
const [maxCandidateCount, setMaxCandidateCount] = useState("");

const [minCandidateAge, setMinCandidateAge] = useState("");
const [maxCandidateAge, setMaxCandidateAge] = useState("");

const [
  candidateRegistrationStart,
  setCandidateRegistrationStart,
] = useState("");

const [
  candidateRegistrationEnd,
  setCandidateRegistrationEnd,
] = useState("");

const [postStartDate, setPostStartDate] = useState("");
const [postEndDate, setPostEndDate] = useState("");

const [posts, setPosts] = useState([]);
const [postsLoading, setPostsLoading] = useState(false);
const [selectedPostId, setSelectedPostId] = useState("");

  const [candidateName, setCandidateName] = useState("");
  const [candidateDepartment, setCandidateDepartment] = useState("");
  const [candidateSemester, setCandidateSemester] = useState("");
  const [candidateBio, setCandidateBio] = useState("");
  const [candidateAgenda, setCandidateAgenda] = useState("");
  const [candidatePhoto, setCandidatePhoto] = useState(null);

  const [viewCandidates, setViewCandidates] = useState([]);
  const [candidatesLoading, setCandidatesLoading] = useState(false);

  const [results, setResults] = useState([]);
  const [resultsLoading, setResultsLoading] = useState(false);

  const [requests, setRequests] = useState([]);
const [requestsLoading, setRequestsLoading] =
  useState(true);

const [transactions, setTransactions] = useState([]);

  const [transactionError, setTransactionError] = useState("");

  const [transactionsLoading, setTransactionsLoading] = useState(true);

  const [dashboardStats, setDashboardStats] = useState({
    activePosts: 0,
    activeCandidates: 0,
  });

  const [
  dashboardStatsLoading,
  setDashboardStatsLoading,
] = useState(true);

  const [activePostsList, setActivePostsList] = useState([]);
  const [allPostsList, setAllPostsList] = useState([]);

  const totalOrganizations = institutions.reduce(
    (sum, inst) => sum + Number(inst.organizationCount || 0),
    0
  );

  const totalPosts = dashboardStats.activePosts;
  const totalCandidates = dashboardStats.activeCandidates;
  const totalTransactions = transactions.length;

  const maxVotes =
  results.length > 0
    ? Math.max(...results.map((c) => c.voteCount))
    : 0;

const topCandidates = results.filter(
  (candidate) => candidate.voteCount === maxVotes
);

const isTie = maxVotes > 0 && topCandidates.length > 1;

const winner =
  maxVotes > 0 && topCandidates.length === 1
    ? topCandidates[0]
    : null;

  const totalResultVotes = results.reduce(
    (sum, item) => sum + item.voteCount,
    0
  );

  const resultData = results.map((item) => ({
    ...item,
    percentage:
      totalResultVotes === 0
        ? "0.0"
        : ((item.voteCount / totalResultVotes) * 100).toFixed(1),
  }));

  const resultChartData = resultData.filter((item) => item.voteCount > 0);

  const getContract = useCallback(async () => {
    if (!window.ethereum) {
      setMessage("Please install MetaMask.");
      return null;
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
  }, []);

  const loadTransactions = useCallback(async () => {
    const token =
      localStorage.getItem("access_token") ||
      localStorage.getItem("token");

    if (!token) {
      setTransactionError(
        "Your login session is unavailable. Please log in again."
      );

      setTransactionsLoading(false);
      return [];
    }

    setTransactionsLoading(true);

    try {
      const res = await axios.get(
        `${API_URL}/transactions`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = Array.isArray(res.data)
        ? res.data
        : [];

      setTransactions(data);

      setTransactionError("");

      return data;

    } catch (err) {
      console.error(
        "Transaction loading error:",
        err
      );

      // Do NOT clear already loaded rows here.
      // A backend outage does not mean the blockchain
      // transaction history has disappeared.
      if (!err?.response) {
        setTransactionError(
          "The EVoTE backend is currently unavailable. Blockchain transactions remain recorded on Ethereum Sepolia."
        );
      } else {
        setTransactionError(
          err?.response?.data?.detail ||
            "Transaction history could not be loaded right now. Blockchain records remain on Ethereum Sepolia."
        );
      }

      return null;

    } finally {
      setTransactionsLoading(false);
    }
  }, []);

  const clearTransactionError = useCallback(() => {
    setTransactionError("");
  }, []);


  const connectWallet = useCallback(async () => {
    if (!window.ethereum) {
      setMessage("Please install MetaMask.");
      return;
    }

    try {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      if (accounts.length > 0) {
        setAccount(accounts[0]);
        localStorage.setItem("adminWallet", accounts[0]);
        setMessage("Wallet connected successfully.");
      }
    } catch (err) {
      setIsSyncing(false);
      setMessage(err.message || "Failed to connect wallet.");
    }
  }, []);

  const checkWalletConnected = useCallback(async () => {
    const savedWallet = localStorage.getItem("adminWallet");

    if (savedWallet) {
      setAccount(savedWallet);
      return;
    }

    if (!window.ethereum) return;

    const accounts = await window.ethereum.request({
      method: "eth_accounts",
    });

    if (accounts.length > 0) {
      setAccount(accounts[0]);
      localStorage.setItem("adminWallet", accounts[0]);
    }
  }, []);

  const loadUsers = useCallback(async () => {
    setUsersLoading(true);

    try {
      const token =
        localStorage.getItem("access_token") ||
        localStorage.getItem("token");

      if (!token) {
        setUsers([]);
        setMessage("Login token not found.");
        return;
      }

      const res = await axios.get(
        `${API_URL}/users`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setUsers(
        Array.isArray(res.data)
          ? res.data
          : []
      );
    } catch (err) {
      console.error(
        "User loading error:",
        err
      );

      setUsers([]);

      handleApiError(
        err,
        "Failed to load users."
      );
    } finally {
      setUsersLoading(false);
    }
  }, [handleApiError]);

  const loadInstitutions = useCallback(async () => {
    setInstitutionsLoading(true);

    try {
      const contract = await getContract();

      if (!contract) {
        return;
      }

      const count = Number(
        await contract.institutionCount()
      );

      const temp = [];

      for (let i = 1; i <= count; i++) {
        const institution =
          await contract.institutions(i);

        temp.push({
          id: i,
          name: institution.name,
          organizationCount: Number(
            institution.organizationCount
          ),
        });
      }

      setInstitutions(temp);
    } catch (err) {
      console.error(
        "Failed to load institutions:",
        err
      );

      setMessage(
        "Failed to load institutions"
      );
    } finally {
      setInstitutionsLoading(false);
    }
  }, [getContract]);

  const loadDashboardStats = useCallback(async () => {
    setDashboardStatsLoading(true);

    try {
      const contract = await getContract();

      if (!contract) {
        return;
      }

      const institutionCount = Number(
        await contract.institutionCount()
      );

      const now = Math.floor(
        Date.now() / 1000
      );

      let activePosts = 0;
      let activeCandidates = 0;

      const activePostListTemp = [];
      const allPostListTemp = [];

      for (
        let i = 1;
        i <= institutionCount;
        i++
      ) {
        const institution =
          await contract.institutions(i);

        const organizationCount = Number(
          institution.organizationCount
        );

        for (
          let j = 1;
          j <= organizationCount;
          j++
        ) {
          const org =
            await contract.getOrganization(
              i,
              j
            );

          const postCount = Number(
            org[3]
          );

          for (
            let k = 1;
            k <= postCount;
            k++
          ) {
            const post =
              await contract.getPost(
                i,
                j,
                k
              );

            const candidateCount = Number(
              post.candidateCount
            );

            const startDate = Number(
              post.votingStart
            );

            const endDate = Number(
              post.votingEnd
            );

            const postItem = {
              id: Number(post.id),
              title: post.title,

              institutionId: i,
              institutionName:
                institution.name,

              organizationId: j,
              organizationName:
                org[1],

              candidateCount,
              startDate,
              endDate,
            };

            allPostListTemp.push(
              postItem
            );

            if (
              startDate > 0 &&
              endDate > 0 &&
              now >= startDate &&
              now <= endDate
            ) {
              activePosts++;
              activeCandidates +=
                candidateCount;

              activePostListTemp.push(
                postItem
              );
            }
          }
        }
      }

      setActivePostsList(
        activePostListTemp
      );

      setAllPostsList(
        allPostListTemp
      );

      setDashboardStats({
        activePosts,
        activeCandidates,
      });
    } catch (err) {
      console.error(
        "Failed to load dashboard stats:",
        err
      );

      setMessage(
        "Failed to load dashboard stats"
      );
    } finally {
      setDashboardStatsLoading(false);
    }
  }, [getContract]);

  async function createInstitution() {
    let progressTimer = null;

    try {
      if (!institutionName.trim()) {
        setMessage("Please enter institution name");

        return {
          success: false,
        };
      }

      const exists = institutions.some(
        (inst) =>
          inst.name.toLowerCase().trim() ===
          institutionName.toLowerCase().trim()
      );

      if (exists) {
        setMessage("Institution already exists");

        return {
          success: false,
        };
      }

      const createdInstitutionName =
        institutionName.trim();

      const ok = await askConfirm({
        title: "Create Institution",
        message: `Do you want to create institution "${createdInstitutionName}"?`,
        confirmText: "Create",
      });

      if (!ok) {
        return {
          success: false,
          cancelled: true,
        };
      }

      const token =
        localStorage.getItem("access_token") ||
        localStorage.getItem("token");

      if (!token) {
        setMessage(
          "Login token not found. Please log in again."
        );

        return {
          success: false,
        };
      }

      setIsSyncing(true);

      // =====================================================
      // LIVE PROGRESS MESSAGE
      //
      // Blockchain writes can take several seconds.
      // Alternate the SAME top status banner so the page
      // never looks frozen.
      // =====================================================

      let showCreating = true;

      setMessage("Creating institution...");

      progressTimer = setInterval(() => {
        showCreating = !showCreating;

        setMessage(
          showCreating
            ? "Creating institution..."
            : "Synchronizing blockchain..."
        );
      }, 1500);

      const res = await axios.post(
        `${API_URL}/blockchain/create-institution`,
        {
          name: createdInstitutionName,
          user_id: adminUser?.id,
          full_name: adminUser?.full_name,
          email: adminUser?.email,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const transactionHash =
        res.data.tx_hash;

      // Blockchain transaction has returned.
      // Keep one clear synchronization message while
      // refreshing the application data.
      if (progressTimer) {
        clearInterval(progressTimer);
        progressTimer = null;
      }

      setMessage(
        "Synchronizing blockchain..."
      );

      const newInstitution = {
        id: institutions.length + 1,
        name: createdInstitutionName,
        organizationCount: 0,
      };

      setInstitutions(
        (prev) => [
          ...prev,
          newInstitution,
        ]
      );

      const newTx = {
        id: transactions.length + 1,
        action: `Create Institution: ${createdInstitutionName}`,
        full_name: adminUser?.full_name,
        email: adminUser?.email,
        role: adminUser?.role || "admin",
        tx_hash: transactionHash,
        from_address: account,
        status: "success",
        created_at: Date.now(),
      };

      setTransactions(
        (prev) => [
          newTx,
          ...prev,
        ]
      );

      // Refresh actual blockchain + dashboard + history data
      // before showing success.
      await loadInstitutions();
      await loadDashboardStats();
      await loadTransactions();

      setInstitutionName("");
      setMessage("");
      setIsSyncing(false);

      return {
        success: true,
        name: createdInstitutionName,
        txHash: transactionHash,
      };

    } catch (err) {
      if (progressTimer) {
        clearInterval(progressTimer);
        progressTimer = null;
      }

      setIsSyncing(false);

      console.error(
        "Create institution failed:",
        err
      );

      const errorMessage =
        handleApiError(
          err,
          "Failed to create institution."
        );

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  async function loadOrganizations(
    institutionId = selectedInstitutionId
  ) {
    setOrganizationsLoading(true);

    try {
      if (!institutionId) {
        setOrganizations([]);
        return;
      }

      const contract = await getContract();

      if (!contract) {
        setOrganizations([]);
        return;
      }

      const institution =
        await contract.institutions(
          Number(institutionId)
        );

      const count = Number(
        institution.organizationCount
      );

      const temp = [];

      for (let i = 1; i <= count; i++) {
        const org =
          await contract.getOrganization(
            Number(institutionId),
            i
          );

        temp.push({
          id: Number(org[0]),
          name: org[1],
          exists: org[2],
          postCount: Number(org[3]),
        });
      }

      setOrganizations(temp);
    } catch (err) {
      console.error(
        "Failed to load organizations:",
        err
      );

      setOrganizations([]);

      setMessage(
        "Failed to load organizations"
      );
    } finally {
      setOrganizationsLoading(false);
    }
  }

  async function createOrganization() {
    let progressTimer = null;

    try {
      if (!selectedInstitutionId) {
        setMessage("Please select institution first");

        return {
          success: false,
        };
      }

      if (!organizationName.trim()) {
        setMessage("Please enter organization name");

        return {
          success: false,
        };
      }

      const exists = organizations.some(
        (org) =>
          org.name.toLowerCase().trim() ===
          organizationName.toLowerCase().trim()
      );

      if (exists) {
        setMessage("Organization already exists");

        return {
          success: false,
        };
      }

      const createdOrganizationName =
        organizationName.trim();

      const selectedInstitution =
        institutions.find(
          (inst) =>
            Number(inst.id) ===
            Number(selectedInstitutionId)
        );

      const createdInstitutionName =
        selectedInstitution?.name || "";

      const ok = await askConfirm({
        title: "Create Organization",
        message: `Do you want to create organization "${createdOrganizationName}"?`,
        confirmText: "Create",
      });

      if (!ok) {
        return {
          success: false,
          cancelled: true,
        };
      }

      const token =
        localStorage.getItem("access_token") ||
        localStorage.getItem("token");

      if (!token) {
        setMessage(
          "Login token not found. Please log in again."
        );

        return {
          success: false,
        };
      }

      setIsSyncing(true);

      // =====================================================
      // LIVE PROGRESS MESSAGE
      // =====================================================

      let showCreating = true;

      setMessage("Creating organization...");

      progressTimer = setInterval(() => {
        showCreating = !showCreating;

        setMessage(
          showCreating
            ? "Creating organization..."
            : "Synchronizing blockchain..."
        );
      }, 1500);

      const res = await axios.post(
        `${API_URL}/blockchain/create-organization`,
        {
          institution_id:
            Number(selectedInstitutionId),

          name:
            createdOrganizationName,

          user_id:
            adminUser?.id,

          full_name:
            adminUser?.full_name,

          email:
            adminUser?.email,
        },
        {
          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        }
      );

      const transactionHash =
        res.data.tx_hash;

      if (progressTimer) {
        clearInterval(progressTimer);
        progressTimer = null;
      }

      setMessage(
        "Synchronizing blockchain..."
      );

      const newOrg = {
        id: organizations.length + 1,
        name: createdOrganizationName,
        exists: true,
        postCount: 0,
      };

      setOrganizations(
        (prev) => [
          ...prev,
          newOrg,
        ]
      );

      setInstitutions(
        (prev) =>
          prev.map((inst) =>
            Number(inst.id) ===
            Number(selectedInstitutionId)
              ? {
                  ...inst,
                  organizationCount:
                    Number(
                      inst.organizationCount
                    ) + 1,
                }
              : inst
          )
      );

      const newTx = {
        id: transactions.length + 1,

        action:
          `Create Organization: ${createdOrganizationName}`,

        full_name:
          adminUser?.full_name,

        email:
          adminUser?.email,

        role:
          adminUser?.role || "admin",

        tx_hash:
          transactionHash,

        from_address:
          account,

        status:
          "success",

        created_at:
          Date.now(),
      };

      setTransactions(
        (prev) => [
          newTx,
          ...prev,
        ]
      );

      await loadOrganizations(
        selectedInstitutionId
      );

      await loadInstitutions();
      await loadDashboardStats();
      await loadTransactions();

      setOrganizationName("");
      setMessage("");
      setIsSyncing(false);

      return {
        success: true,
        name: createdOrganizationName,
        institutionName:
          createdInstitutionName,
        txHash:
          transactionHash,
      };

    } catch (err) {
      if (progressTimer) {
        clearInterval(progressTimer);
        progressTimer = null;
      }

      setIsSyncing(false);

      console.error(
        "Create organization failed:",
        err
      );

      const errorMessage =
        handleApiError(
          err,
          "Failed to create organization."
        );

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  async function loadPosts(
    institutionId = selectedInstitutionId,
    organizationId = selectedOrganizationId
  ) {
    setPostsLoading(true);

    try {
      if (
        !institutionId ||
        !organizationId
      ) {
        setPosts([]);
        return;
      }

      const contract =
        await getContract();

      if (!contract) {
        setPosts([]);
        return;
      }

      const org =
        await contract.getOrganization(
          Number(institutionId),
          Number(organizationId)
        );

      const count =
        Number(org[3]);

      const temp = [];

      for (
        let i = 1;
        i <= count;
        i++
      ) {
        const p =
          await contract.getPost(
            Number(institutionId),
            Number(organizationId),
            i
          );

        temp.push({
          id: Number(p.id),
          title: p.title,
          active: p.active,
          seatLimit: Number(p.seatCount),
          maxCandidateCount: Number(
            p.maxCandidateCount
          ),
          candidateCount: Number(
            p.candidateCount
          ),
          minCandidateAge: Number(
            p.minCandidateAge
          ),
          maxCandidateAge: Number(
            p.maxCandidateAge
          ),
          candidateRegistrationStart:
            Number(
              p.candidateRegistrationStart
            ),
          candidateRegistrationEnd:
            Number(
              p.candidateRegistrationEnd
            ),
          startDate: Number(
            p.votingStart
          ),
          endDate: Number(
            p.votingEnd
          ),
        });
      }

      setPosts(temp);
    } catch (err) {
      console.error(
        "Failed to load posts:",
        err
      );

      setPosts([]);

      setMessage(
        "Failed to load posts"
      );
    } finally {
      setPostsLoading(false);
    }
  }

  async function createPost() {
    let progressTimer = null;

    try {
      // =====================================================
      // BASIC VALIDATION
      // =====================================================

      if (
        !selectedInstitutionId ||
        !selectedOrganizationId
      ) {
        return {
          success: false,
          error:
            "Please select institution and organization first.",
        };
      }

      if (!postTitle.trim()) {
        return {
          success: false,
          error:
            "Please enter election/post title.",
        };
      }

      if (
        !seatLimit ||
        Number(seatLimit) <= 0
      ) {
        return {
          success: false,
          error:
            "Please enter a valid seat count.",
        };
      }

      if (
        !maxCandidateCount ||
        Number(maxCandidateCount) <
          Number(seatLimit)
      ) {
        return {
          success: false,
          error:
            "Maximum candidates must be equal to or greater than seat count.",
        };
      }

      if (
        !minCandidateAge ||
        !maxCandidateAge
      ) {
        return {
          success: false,
          error:
            "Please enter candidate age limits.",
        };
      }

      if (
        Number(maxCandidateAge) <
        Number(minCandidateAge)
      ) {
        return {
          success: false,
          error:
            "Maximum age must be greater than or equal to minimum age.",
        };
      }

      if (
        !candidateRegistrationStart ||
        !candidateRegistrationEnd
      ) {
        return {
          success: false,
          error:
            "Please select candidate registration start and end.",
        };
      }

      if (
        !postStartDate ||
        !postEndDate
      ) {
        return {
          success: false,
          error:
            "Please select voting start and end.",
        };
      }


      // =====================================================
      // TIMESTAMPS
      // =====================================================

      const candidateStartTimestamp =
        Math.floor(
          new Date(
            candidateRegistrationStart
          ).getTime() / 1000
        );

      const candidateEndTimestamp =
        Math.floor(
          new Date(
            candidateRegistrationEnd
          ).getTime() / 1000
        );

      const votingStartTimestamp =
        Math.floor(
          new Date(
            postStartDate
          ).getTime() / 1000
        );

      const votingEndTimestamp =
        Math.floor(
          new Date(
            postEndDate
          ).getTime() / 1000
        );


      // =====================================================
      // DATE VALIDATION
      // =====================================================

      if (
        candidateEndTimestamp <=
        candidateStartTimestamp
      ) {
        return {
          success: false,
          error:
            "Candidate registration end must be after its start.",
        };
      }

      if (
        votingStartTimestamp <=
        candidateEndTimestamp
      ) {
        return {
          success: false,
          error:
            "Voting must start after candidate registration ends.",
        };
      }

      if (
        votingEndTimestamp <=
        votingStartTimestamp
      ) {
        return {
          success: false,
          error:
            "Voting end must be after voting start.",
        };
      }


      // =====================================================
      // SAVE DISPLAY VALUES BEFORE CLEARING FORM
      // =====================================================

      const createdPostTitle =
        postTitle.trim();

      const selectedInstitution =
        institutions.find(
          (inst) =>
            Number(inst.id) ===
            Number(selectedInstitutionId)
        );

      const selectedOrganization =
        organizations.find(
          (org) =>
            Number(org.id) ===
            Number(selectedOrganizationId)
        );

      const createdInstitutionName =
        selectedInstitution?.name || "";

      const createdOrganizationName =
        selectedOrganization?.name || "";


      // =====================================================
      // CONFIRM
      // =====================================================

      const ok = await askConfirm({
        title: "Create Post",
        message:
          `Create "${createdPostTitle}" with ` +
          `${seatLimit} seat(s), ` +
          `maximum ${maxCandidateCount} candidates, ` +
          `age ${minCandidateAge}-${maxCandidateAge}?`,
        confirmText: "Create",
      });

      if (!ok) {
        return {
          success: false,
          cancelled: true,
        };
      }


      // =====================================================
      // AUTH
      // =====================================================

      const token =
        localStorage.getItem("access_token") ||
        localStorage.getItem("token");

      if (!token) {
        setMessage(
          "Login token not found. Please log in again."
        );

        return {
          success: false,
          error:
            "Login token not found. Please log in again.",
        };
      }


      // =====================================================
      // LIVE CREATE / SYNCHRONIZE STATUS
      // =====================================================

      setIsSyncing(true);

      let showCreating = true;

      setMessage(
        "Creating election post..."
      );

      progressTimer = setInterval(() => {
        showCreating = !showCreating;

        setMessage(
          showCreating
            ? "Creating election post..."
            : "Synchronizing blockchain..."
        );
      }, 1500);


      // =====================================================
      // BLOCKCHAIN CREATE
      // =====================================================

      const res = await axios.post(
        `${API_URL}/blockchain/create-post`,
        {
          institution_id:
            Number(selectedInstitutionId),

          organization_id:
            Number(selectedOrganizationId),

          title:
            createdPostTitle,

          seat_count:
            Number(seatLimit),

          max_candidate_count:
            Number(maxCandidateCount),

          min_candidate_age:
            Number(minCandidateAge),

          max_candidate_age:
            Number(maxCandidateAge),

          candidate_registration_start:
            candidateStartTimestamp,

          candidate_registration_end:
            candidateEndTimestamp,

          voting_start:
            votingStartTimestamp,

          voting_end:
            votingEndTimestamp,

          user_id:
            adminUser?.id,

          full_name:
            adminUser?.full_name,

          email:
            adminUser?.email,
        },
        {
          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        }
      );

      const transactionHash =
        res.data.tx_hash;


      // =====================================================
      // FINAL SYNCHRONIZATION
      // =====================================================

      if (progressTimer) {
        clearInterval(progressTimer);
        progressTimer = null;
      }

      setMessage(
        "Synchronizing blockchain..."
      );

      const newTx = {
        id:
          transactions.length + 1,

        action:
          `Create Election/Post - ${createdInstitutionName} - ${createdOrganizationName} - ${createdPostTitle}`,

        full_name:
          adminUser?.full_name,

        email:
          adminUser?.email,

        role:
          adminUser?.role || "admin",

        tx_hash:
          transactionHash,

        from_address:
          account,

        status:
          "success",

        created_at:
          Date.now(),
      };

      setTransactions(
        (prev) => [
          newTx,
          ...prev,
        ]
      );

      await loadPosts(
        selectedInstitutionId,
        selectedOrganizationId
      );

      await loadOrganizations(
        selectedInstitutionId
      );

      await loadDashboardStats();
      await loadTransactions();


      // =====================================================
      // CLEAR FORM
      // =====================================================

      setPostTitle("");
      setSeatLimit("");
      setMaxCandidateCount("");
      setMinCandidateAge("");
      setMaxCandidateAge("");

      setCandidateRegistrationStart("");
      setCandidateRegistrationEnd("");

      setPostStartDate("");
      setPostEndDate("");

      setMessage("");
      setIsSyncing(false);


      // =====================================================
      // RETURN DATA FOR SUCCESS POPUP
      // =====================================================

      return {
        success: true,

        title:
          createdPostTitle,

        institutionName:
          createdInstitutionName,

        organizationName:
          createdOrganizationName,

        txHash:
          transactionHash,
      };

    } catch (err) {
      if (progressTimer) {
        clearInterval(progressTimer);
        progressTimer = null;
      }

      setIsSyncing(false);

      console.error(
        "Create election post failed:",
        err
      );

      const errorMessage =
        handleApiError(
          err,
          "Failed to create election post."
        );

      return {
        success: false,
        error:
          errorMessage,
      };
    }
  }



  async function loadCandidates(
  institutionId = selectedInstitutionId,
  organizationId = selectedOrganizationId,
  postId = selectedPostId
) {
  setCandidatesLoading(true);
  setResultsLoading(true);

  try {
    if (
      !institutionId ||
      !organizationId ||
      !postId
    ) {
      setViewCandidates([]);
      setResults([]);
      return;
    }

    const contract = await getContract();

    if (!contract) {
      setViewCandidates([]);
      setResults([]);
      return;
    }

    // =====================================================
    // 1. LOAD CANDIDATES DIRECTLY FROM BLOCKCHAIN
    // =====================================================

    const post = await contract.getPost(
      Number(institutionId),
      Number(organizationId),
      Number(postId)
    );

    const candidateCount = Number(
      post.candidateCount
    );

    const blockchainCandidates = [];

    for (
      let i = 1;
      i <= candidateCount;
      i++
    ) {
      const candidate =
        await contract.getCandidate(
          Number(institutionId),
          Number(organizationId),
          Number(postId),
          i
        );

      let blockchainName =
        String(candidate.name || "");

      let blockchainAge = null;

      // ===================================================
      // Candidate wallet points to the registered blockchain
      // User. The User struct already contains dateOfBirth.
      // So age remains available even when FastAPI is off.
      // ===================================================

      try {
        const blockchainUser =
          await contract.users(
            candidate.wallet
          );

        const fullName =
          String(
            blockchainUser.fullName ??
            blockchainUser[1] ??
            ""
          );

        const dateOfBirth =
          Number(
            blockchainUser.dateOfBirth ??
            blockchainUser[2] ??
            0
          );

        if (fullName) {
          blockchainName =
            fullName;
        }

        if (dateOfBirth > 0) {
          blockchainAge =
            Number(
              await contract.calculateAge(
                dateOfBirth
              )
            );
        }
      } catch (userError) {
        console.warn(
          "Could not load candidate user data from blockchain:",
          userError
        );
      }

      blockchainCandidates.push({
        id:
          Number(candidate.id),

        wallet:
          String(
            candidate.wallet || ""
          ),

        name:
          blockchainName,

        age:
          blockchainAge,

        voteCount:
          Number(
            candidate.voteCount
          ),

        exists:
          Boolean(
            candidate.exists
          ),
      });
    }

    // =====================================================
    // 2. OPTIONAL BACKEND PROFILE DATA
    //
    // Backend is now only optional enrichment for profile
    // photo. Candidate name, wallet, age and vote count are
    // blockchain-backed.
    // =====================================================

    let profiles = [];

    try {
      const profileRes =
        await axios.get(
          `${API_URL}/candidate-profiles/${institutionId}/${postId}`
        );

      profiles =
        Array.isArray(
          profileRes.data
        )
          ? profileRes.data
          : [];
    } catch (profileError) {
      console.warn(
        "Candidate profile backend unavailable. Using blockchain data only.",
        profileError
      );

      profiles = [];
    }

    // =====================================================
    // 3. MERGE BLOCKCHAIN DATA + OPTIONAL PHOTO
    // =====================================================

    const finalCandidates =
      blockchainCandidates.map(
        (candidate) => {
          const candidateWallet =
            String(
              candidate.wallet || ""
            ).toLowerCase();

          const profile =
            profiles.find(
              (p) =>
                String(
                  p.wallet_address || ""
                ).toLowerCase() ===
                candidateWallet
            );

          return {
            ...candidate,

            name:
              candidate.name ||
              profile?.name ||
              "Unknown Candidate",

            // Age is blockchain-only.
            age:
              candidate.age ??
              null,

            // Photo is optional backend/profile data.
            photo:
              profile?.photo ||
              "",

            // Blockchain wallet is primary.
            wallet_address:
              candidate.wallet ||
              profile?.wallet_address ||
              "",
          };
        }
      );

    setViewCandidates(
      finalCandidates
    );

    setResults(
      finalCandidates
    );

  } catch (err) {
    console.error(
      "Failed to load candidates:",
      err
    );

    setViewCandidates([]);
    setResults([]);

    handleApiError(
      err,
      "Failed to load candidates."
    );

  } finally {
    setCandidatesLoading(false);
    setResultsLoading(false);
  }
}

// ============================================================
// LOAD ALL CANDIDATE REQUESTS
// FROM ALL INSTITUTIONS -> ORGANIZATIONS -> POSTS
// ============================================================

async function loadAllCandidateRequests() {
  setRequestsLoading(true);

  try {
    const token =
      localStorage.getItem("access_token") ||
      localStorage.getItem("token");

    if (!token) {
      setRequests([]);
      setMessage("Login token not found.");
      return;
    }

    const res = await axios.get(
      `${API_URL}/candidate-requests`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = Array.isArray(res.data)
      ? res.data
      : [];

    setRequests(
      [...data].reverse()
    );
  } catch (err) {
    console.error(
      "Failed to load candidate requests:",
      err
    );

    setRequests([]);

    handleApiError(
      err,
      "Failed to load candidate requests."
    );
  } finally {
    setRequestsLoading(false);
  }
}


  async function approveCandidateRequest(request) {
  try {
    const ok = await askConfirm({
      title: "Approve Candidate",
      message: `Do you want to approve candidate "${request.candidate_name}"?`,
      confirmText: "Approve",
    });

    if (!ok) return;

    setMessage("Approving request...");

    const token =
      localStorage.getItem("access_token") ||
      localStorage.getItem("token");

    if (!token) {
      setMessage("Login token not found.");
      return;
    }

    const res = await axios.put(
      `${API_URL}/approve-candidate/${request.id}`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    setMessage(
      res.data.message ||
        "Candidate approved successfully"
    );

    await loadAllCandidateRequests();
  } catch (err) {
    setIsSyncing(false);

    console.error(
      "Approve candidate request failed:",
      err
    );

    handleApiError(
      err,
      "Failed to approve candidate request."
    );
  }
}

  async function rejectCandidateRequest(request) {
  try {
    const ok = await askConfirm({
      title: "Reject Candidate",
      message: `Do you want to reject candidate "${request.candidate_name}"?`,
      confirmText: "Reject",
    });

    if (!ok) return;

    setMessage("Rejecting request...");

    const token =
      localStorage.getItem("access_token") ||
      localStorage.getItem("token");

    if (!token) {
      setMessage("Login token not found.");
      return;
    }

    const res = await axios.put(
      `${API_URL}/reject-candidate/${request.id}`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    setMessage(
      res.data.message ||
        "Candidate request rejected"
    );

    await loadAllCandidateRequests();
  } catch (err) {
    setIsSyncing(false);

    console.error(
      "Reject candidate request failed:",
      err
    );

    handleApiError(
      err,
      "Failed to reject candidate request."
    );
  }
}

  function logout() {
    localStorage.clear();
    window.location.href = "/";
  }

  useEffect(() => {
  loadUsers();
  checkWalletConnected();
  loadInstitutions();
  loadTransactions();
  loadDashboardStats();
  loadAllCandidateRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = {
    adminUser,
    setAdminUser,
    account,
    message,
    setMessage,
    isSyncing,
    confirmBox,
    closeConfirm,

    errorModal,
    closeErrorModal,

    users,
    usersLoading,

    institutionName,
    setInstitutionName,
    institutions,
    institutionsLoading,
    selectedInstitutionId,
    setSelectedInstitutionId,

    organizationName,
    setOrganizationName,
    organizations,
    setOrganizations,
    organizationsLoading,
    selectedOrganizationId,
    setSelectedOrganizationId,

    postTitle,
    setPostTitle,

    seatLimit,
    setSeatLimit,

    maxCandidateCount,
    setMaxCandidateCount,

    minCandidateAge,
    setMinCandidateAge,

    maxCandidateAge,
    setMaxCandidateAge,

    candidateRegistrationStart,
    setCandidateRegistrationStart,

    candidateRegistrationEnd,
    setCandidateRegistrationEnd,

    postStartDate,
    setPostStartDate,

    postEndDate,
    setPostEndDate,

    posts,
    setPosts,
    postsLoading,

    selectedPostId,
    setSelectedPostId,

    candidateName,
    setCandidateName,
    candidateDepartment,
    setCandidateDepartment,
    candidateSemester,
    setCandidateSemester,
    candidateBio,
    setCandidateBio,
    candidateAgenda,
    setCandidateAgenda,
    candidatePhoto,
    setCandidatePhoto,

    viewCandidates,
    setViewCandidates,
    candidatesLoading,

    results,
    setResults,
    resultsLoading,

    requests,
    setRequests,
    requestsLoading,
    transactions,
    transactionError,
    transactionsLoading,
    clearTransactionError,

    dashboardStats,
    dashboardStatsLoading,
    activePostsList,
    allPostsList,

    totalOrganizations,
    totalPosts,
    totalCandidates,
    totalTransactions,
    winner,
    isTie,
    topCandidates,
    totalResultVotes,
    resultData,
    resultChartData,
    RESULT_COLORS,

    connectWallet,
    loadUsers,
    loadInstitutions,
    loadDashboardStats,
    createInstitution,
    loadOrganizations,
    createOrganization,
    loadPosts,
    createPost,
    loadCandidates,
   
    loadAllCandidateRequests,
    approveCandidateRequest,
    rejectCandidateRequest,
    loadTransactions,
    logout,
  };

  return (
    <AdminContext.Provider value={value}>
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
                  "1px solid rgba(34,197,94,0.25)",
                background:
                  "rgba(34,197,94,0.07)",
                color: "#86efac",
                fontSize: "11px",
                lineHeight: "1.45",
                textAlign: "center",
              }}
            >
              No blockchain transaction was created.
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
    </AdminContext.Provider>
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


export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error("useAdmin must be used inside AdminProvider");
  return ctx;
}