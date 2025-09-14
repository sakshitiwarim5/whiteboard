
import React from "react";
import { FiTrash2 } from "react-icons/fi";

export default function Toolbar({ socket, roomId }) {
  const clear = () => {
    if (socket) socket.emit("clear-canvas", { roomId });
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "10px 16px",
        background: "#f9fafb",
        border: "1px solid #e5e7eb",
        borderRadius: "8px",
        boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
      }}
    >
      {/* Left side: Actions */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <button
          onClick={clear}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "6px 12px",
            background: "#ef4444",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: 500,
          }}
        >
          <FiTrash2 size={16} /> Clear
        </button>
      </div>

      {/* Right side: Status */}
      <div
        style={{
          fontSize: "13px",
          color: "#6b7280",
          fontStyle: "italic",
        }}
      >
        Pencil only • Live sync
      </div>
    </div>
  );
}
