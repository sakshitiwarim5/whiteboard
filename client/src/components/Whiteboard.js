
import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import DrawingCanvas from "./DrawingCanvas";
import Toolbar from "./Toolbar";
import UserCursors from "./UserCursors";
import { FiUsers, FiLogOut } from "react-icons/fi";

const SOCKET_URL =
  process.env.REACT_APP_SOCKET || window.location.origin.replace(/^http/, "ws");

export default function Whiteboard({ roomId, onLeave }) {
  const [socket, setSocket] = useState(null);
  const [usersCount, setUsersCount] = useState(1);
  const [cursors, setCursors] = useState({});
  const colorRef = useRef("#000");

  useEffect(() => {
    const s = io(SOCKET_URL, { transports: ["websocket"] });
    setSocket(s);
    s.on("connect", () => {
      s.emit("join-room", { roomId });
    });
    s.on("user-count", ({ count }) => setUsersCount(count || 1));
    s.on("init-color", ({ color }) => (colorRef.current = color));
    s.on("cursor-move", ({ socketId, x, y, color }) => {
      setCursors((prev) => ({
        ...prev,
        [socketId]: { x, y, color, last: Date.now() },
      }));
    });
    s.on("user-left", ({ socketId }) => {
      setCursors((prev) => {
        const n = { ...prev };
        delete n[socketId];
        return n;
      });
    });
    return () => {
      if (s) {
        s.emit("leave-room", { roomId });
        s.disconnect();
      }
    };
  }, [roomId]);

  useEffect(() => {
    const t = setInterval(() => {
      const now = Date.now();
      setCursors((prev) => {
        const n = { ...prev };
        for (const k of Object.keys(n)) {
          if (now - n[k].last > 3000) delete n[k];
        }
        return n;
      });
    }, 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div
      className="whiteboard-wrap"
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        background: "#f9fafb",
      }}
    >
      {/* Topbar */}
      <div
        className="topbar"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "12px 20px",
          background: "#1f2937",
          color: "white",
          boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ fontWeight: 600, fontSize: "16px" }}>
            Room: <strong>{roomId}</strong>
          </span>
          <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: "#374151",
              padding: "4px 10px",
              borderRadius: "6px",
              fontSize: "14px",
            }}
          >
            <FiUsers /> {usersCount}
          </span>
        </div>
        <button
          onClick={() => onLeave()}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "8px 14px",
            background: "#ef4444",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: 500,
          }}
        >
          <FiLogOut /> Leave
        </button>
      </div>

      {/* Canvas area */}
      <div
        className="canvas-area"
        style={{
          flex: 1,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <DrawingCanvas socket={socket} roomId={roomId} myColorRef={colorRef} />
        <UserCursors cursors={cursors} />
      </div>

      {/* Toolbar */}
      <div
        className="toolbar"
        style={{
          padding: "12px",
          background: "#fff",
          borderTop: "1px solid #e5e7eb",
          boxShadow: "0 -2px 6px rgba(0,0,0,0.05)",
        }}
      >
        <Toolbar socket={socket} roomId={roomId} />
      </div>
    </div>
  );
}
