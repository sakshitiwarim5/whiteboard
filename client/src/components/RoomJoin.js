import React, { useState } from "react";
import axios from "axios";
import { FiUsers } from "react-icons/fi";

function randomRoom() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export default function RoomJoin({ onJoin }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  const join = async (r) => {
    const rid = r || code.trim();
    if (!rid) {
      setError("Enter room code or generate one");
      return;
    }
    try {
      await axios.post((process.env.REACT_APP_API || "") + "/api/rooms/join", {
        roomId: rid,
      });
      onJoin(rid);
    } catch (e) {
      setError("Unable to join room");
    }
  };

  return (
    <div
      className="join-container"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        background: "linear-gradient(135deg, #f9fafb, #e5e7eb)",
        padding: "20px",
      }}
    >
      <div
        className="join-card"
        style={{
          background: "#fff",
          padding: "32px",
          borderRadius: "12px",
          boxShadow: "0 6px 16px rgba(0,0,0,0.1)",
          width: "100%",
          maxWidth: "420px",
          textAlign: "center",
        }}
      >
        {/* Heading with Icon */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
            marginBottom: "20px",
          }}
        >
          <FiUsers size={28} color="#2563eb" />
          <h2 style={{ margin: 0, color: "#111827" }}>
            Join a Whiteboard Room
          </h2>
        </div>

        {/* Input Row */}
        <div
          className="input-row"
          style={{
            display: "flex",
            gap: "8px",
            marginBottom: "16px",
          }}
        >
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="Enter Room Code"
            maxLength={8}
            style={{
              flex: 1,
              padding: "12px",
              borderRadius: "6px",
              border: "1px solid #d1d5db",
              fontSize: "16px",
            }}
          />
          <button
            className="btn"
            onClick={() => join()}
            style={{
              padding: "12px 20px",
              background: "#2563eb",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: "600",
            }}
          >
            Join
          </button>
        </div>

        {/* Buttons Row */}
        <div
          style={{
            display: "flex",
            gap: "12px",
            justifyContent: "center",
            marginBottom: "12px",
          }}
        >
          <button
            className="btn"
            onClick={() => {
              const r = randomRoom();
              setCode(r);
              join(r);
            }}
            style={{
              flex: 1,
              padding: "12px",
              background: "#10b981",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: "600",
            }}
          >
            Create Room
          </button>
          <button
            className="btn"
            onClick={() => {
              const r = randomRoom();
              setCode(r);
            }}
            style={{
              flex: 1,
              padding: "12px",
              background: "#f59e0b",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: "600",
            }}
          >
            Generate
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <p style={{ color: "red", marginTop: "8px", fontSize: "14px" }}>
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
