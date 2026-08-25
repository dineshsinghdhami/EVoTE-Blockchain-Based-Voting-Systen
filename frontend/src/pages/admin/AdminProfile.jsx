import { API_URL } from "../../config";
import { useState } from "react";
import axios from "axios";

import {
  FiUser,
  FiMail,
  FiPhone,
  FiShield,
  FiCamera,
  FiCalendar,
} from "react-icons/fi";

import { useAdmin } from "../../context/AdminContext";


function formatDateOfBirthWithAge(dateOfBirth) {
  if (!dateOfBirth) {
    return "Not provided";
  }

  const dateText =
    String(dateOfBirth).split("T")[0];

  const parts = dateText.split("-");

  if (parts.length !== 3) {
    return dateText;
  }

  const year = Number(parts[0]);
  const month = Number(parts[1]);
  const day = Number(parts[2]);

  if (!year || !month || !day) {
    return dateText;
  }

  const today = new Date();

  let age =
    today.getFullYear() - year;

  const monthDifference =
    today.getMonth() + 1 - month;

  if (
    monthDifference < 0 ||
    (
      monthDifference === 0 &&
      today.getDate() < day
    )
  ) {
    age--;
  }

  if (age < 0) {
    return dateText;
  }

  return `${dateText} (Age ${age})`;
}


function AdminProfile() {
  const {
    adminUser,
    setAdminUser,
    account,
    setMessage,
  } = useAdmin();

  const [uploading, setUploading] =
    useState(false);


  async function uploadProfilePicture(e) {
    const file = e.target.files?.[0];

    if (!file || !adminUser?.id) {
      return;
    }

    const token =
      localStorage.getItem("access_token") ||
      localStorage.getItem("token");

    if (!token) {
      setMessage(
        "Login token not found. Please log in again."
      );

      return;
    }

    const formData = new FormData();

    formData.append(
      "file",
      file
    );

    try {
      setUploading(true);

      const res = await axios.post(
        `${API_URL}/upload-profile/${adminUser.id}`,
        formData,
        {
          headers: {
            "Content-Type":
              "multipart/form-data",

            Authorization:
              `Bearer ${token}`,
          },
        }
      );

      const updatedUser = {
        ...adminUser,
        profile_picture:
          res.data.profile_picture,
      };

      setAdminUser(updatedUser);

      localStorage.setItem(
        "user",
        JSON.stringify(updatedUser)
      );

      setMessage(
        "Profile picture updated successfully."
      );

    } catch (err) {
      console.error(
        "Failed to upload admin profile picture:",
        err
      );

      const errorMessage =
        err?.response?.data?.detail ||
        "Failed to upload profile picture.";

      setMessage(errorMessage);

    } finally {
      setUploading(false);

      // Allows choosing the same file again
      e.target.value = "";
    }
  }


  const profileImage =
    adminUser?.profile_picture
      ? `${API_URL}/${adminUser.profile_picture}`
      : null;


  const wallet =
    account ||
    adminUser?.wallet_address ||
    localStorage.getItem("walletAddress") ||
    localStorage.getItem("adminWallet");


  const formattedRole =
    adminUser?.role === "superadmin"
      ? "Super Admin"
      : adminUser?.role === "admin"
        ? "Admin"
        : adminUser?.role || "Admin";


  return (
    <div
      style={{
        padding: "28px",
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      {/* PAGE HEADER */}
      <div
        style={{
          marginBottom: "24px",
        }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: "30px",
            color: "#ffffff",
          }}
        >
          My Profile
        </h1>

        <p
          style={{
            margin: "8px 0 0",
            color: "#aeb6c2",
            fontSize: "15px",
          }}
        >
          View and manage your administrator
          account information.
        </p>
      </div>


      {/* MAIN PROFILE CARD */}
      <div
        style={{
          background: "#1f1f1f",
          border: "1px solid #363636",
          borderRadius: "16px",
          overflow: "hidden",
        }}
      >

        {/* PROFILE HEADER */}
        <div
          style={{
            padding: "30px",
            display: "flex",
            alignItems: "center",
            gap: "22px",
            borderBottom:
              "1px solid #363636",
            flexWrap: "wrap",
          }}
        >

          {/* PROFILE PHOTO */}
          <div
            style={{
              width: "100px",
              height: "100px",
              minWidth: "100px",
              borderRadius: "50%",
              overflow: "hidden",
              background: "#2b2b2b",
              border:
                "2px solid #4a4a4a",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {profileImage ? (
              <img
                src={profileImage}
                alt="Admin Profile"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            ) : (
              <FiUser
                size={42}
                style={{
                  color: "#aeb6c2",
                }}
              />
            )}
          </div>


          {/* NAME AND ROLE */}
          <div>
            <h2
              style={{
                margin: 0,
                color: "#ffffff",
                fontSize: "25px",
              }}
            >
              {adminUser?.full_name ||
                "Administrator"}
            </h2>

            <p
              style={{
                margin: "6px 0 14px",
                color: "#aeb6c2",
              }}
            >
              {formattedRole}
            </p>


            {/* CHANGE PHOTO */}
            <label
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                background: "#1687a3",
                color: "#ffffff",
                padding: "9px 14px",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: "600",
                cursor: uploading
                  ? "not-allowed"
                  : "pointer",
                opacity:
                  uploading ? 0.6 : 1,
              }}
            >
              <FiCamera />

              {uploading
                ? "Uploading..."
                : "Change Photo"}

              <input
                type="file"
                accept="
                  image/png,
                  image/jpeg,
                  image/jpg,
                  image/webp
                "
                onChange={
                  uploadProfilePicture
                }
                disabled={uploading}
                hidden
              />
            </label>
          </div>
        </div>


        {/* PERSONAL INFORMATION */}
        <div
          style={{
            padding: "30px",
          }}
        >
          <h3
            style={{
              margin: "0 0 20px",
              color: "#ffffff",
              fontSize: "19px",
            }}
          >
            Personal Information
          </h3>


          <div
            style={{
              display: "grid",

              gridTemplateColumns:
                "repeat(auto-fit, minmax(280px, 1fr))",

              gap: "16px",
            }}
          >

            <InfoCard
              icon={<FiUser />}
              label="Full Name"
              value={
                adminUser?.full_name
              }
            />

            <InfoCard
              icon={<FiMail />}
              label="Email Address"
              value={adminUser?.email}
            />

            <InfoCard
              icon={<FiPhone />}
              label="Phone Number"
              value={adminUser?.phone}
            />

            <InfoCard
              icon={<FiCalendar />}
              label="Date of Birth"
              value={
                formatDateOfBirthWithAge(
                  adminUser?.date_of_birth
                )
              }
            />

            <InfoCard
              icon={<FiShield />}
              label="Account Role"
              value={formattedRole}
            />

          </div>


          {/* BLOCKCHAIN WALLET */}
          <h3
            style={{
              margin: "30px 0 20px",
              color: "#ffffff",
              fontSize: "19px",
            }}
          >
            Blockchain Wallet
          </h3>


          <div
            style={{
              background: "#252525",
              border:
                "1px solid #363636",
              borderRadius: "12px",
              padding: "18px",
              display: "flex",
              justifyContent:
                "space-between",
              alignItems: "center",
              gap: "20px",
              flexWrap: "wrap",
            }}
          >

            <div>
              <div
                style={{
                  color: "#9ca3af",
                  fontSize: "13px",
                  marginBottom: "7px",
                }}
              >
                Connected Wallet Address
              </div>

              <div
                style={{
                  color: wallet
                    ? "#34d399"
                    : "#ffffff",
                  fontSize: "14px",
                  wordBreak:
                    "break-all",
                }}
              >
                {wallet ||
                  "No wallet connected"}
              </div>
            </div>


            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",

                color: wallet
                  ? "#34d399"
                  : "#f59e0b",

                fontWeight: "600",
                fontSize: "14px",
              }}
            >

              <span
                style={{
                  width: "9px",
                  height: "9px",
                  borderRadius: "50%",

                  background: wallet
                    ? "#34d399"
                    : "#f59e0b",

                  display:
                    "inline-block",
                }}
              />

              {wallet
                ? "Connected"
                : "Not Connected"}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


function InfoCard({
  icon,
  label,
  value,
}) {
  return (
    <div
      style={{
        background: "#252525",
        border: "1px solid #363636",
        borderRadius: "12px",
        padding: "18px",
        display: "flex",
        gap: "14px",
        alignItems: "center",
      }}
    >

      <div
        style={{
          width: "40px",
          height: "40px",
          minWidth: "40px",
          borderRadius: "9px",
          background: "#173842",
          color: "#42c5e8",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "18px",
        }}
      >
        {icon}
      </div>


      <div
        style={{
          minWidth: 0,
        }}
      >
        <div
          style={{
            color: "#9ca3af",
            fontSize: "12px",
            marginBottom: "5px",
          }}
        >
          {label}
        </div>

        <div
          style={{
            color: "#ffffff",
            fontSize: "15px",
            fontWeight: "600",
            wordBreak: "break-word",
          }}
        >
          {value || "Not provided"}
        </div>
      </div>

    </div>
  );
}


export default AdminProfile;