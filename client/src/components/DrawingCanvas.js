
import React, { useEffect, useRef, useState } from "react";

export default function DrawingCanvas({ socket, roomId, myColorRef }) {
  const canvasRef = useRef();
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState("#000000");
  const [width, setWidth] = useState(2);
  const pathRef = useRef([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const resizeCanvas = () => {
      const ratio = window.devicePixelRatio || 1;
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;

      canvas.width = w * ratio;
      canvas.height = h * ratio;
      ctx.setTransform(1, 0, 0, 1, 0, 0); 
      ctx.scale(ratio, ratio);
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
    };
  }, []);

  useEffect(() => {
    const c = canvasRef.current;
    const ctx = c.getContext("2d");
    const onLoadCommands = (commands) => {
      commands.forEach((cmd) => {
        if (cmd.type === "stroke") {
          drawStroke(ctx, cmd.data, false);
        } else if (cmd.type === "clear") {
          ctx.clearRect(0, 0, c.width, c.height);
        }
      });
    };
    if (socket) {
      socket.on("load-commands", onLoadCommands);
      socket.on("draw-start", ({ payload }) => {
        beginRemoteStroke(ctx, payload);
      });
      socket.on("draw-move", ({ payload }) => {
        moveRemoteStroke(ctx, payload);
      });
      socket.on("draw-end", ({ command }) => {
        endRemoteStroke(ctx, command);
      });
      socket.on("clear-canvas", () => {
        ctx.clearRect(0, 0, c.width, c.height);
      });
    }
    return () => {
      if (socket) {
        socket.off("load-commands", onLoadCommands);
      }
    };
  }, [socket]);

  function drawStroke(ctx, data, smooth = true) {
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.strokeStyle = data.color;
    ctx.lineWidth = data.width;
    ctx.beginPath();
    const path = data.path || [];
    if (path.length === 0) return;
    ctx.moveTo(path[0].x, path[0].y);
    for (let i = 1; i < path.length; i++) {
      ctx.lineTo(path[i].x, path[i].y);
    }
    ctx.stroke();
  }

  function beginRemoteStroke(ctx, payload) {
    drawStroke(
      ctx,
      { color: payload.color, width: payload.width, path: [payload.point] },
      false
    );
  }
  function moveRemoteStroke(ctx, payload) {
    drawStroke(
      ctx,
      { color: payload.color, width: payload.width, path: payload.path },
      false
    );
  }
  function endRemoteStroke(ctx, command) {
    drawStroke(ctx, command.data, false);
  }

  function getPos(e) {
    const rect = canvasRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  }

  function start(e) {
    if (!socket) return;
    const p = getPos(e);
    setIsDrawing(true);
    pathRef.current = [p];
    socket.emit("draw-start", { roomId, payload: { point: p, color, width } });
  }
  function draw(e) {
    if (!isDrawing || !socket) return;
    const p = getPos(e);
    pathRef.current.push(p);
    socket.emit("draw-move", { roomId, payload: { path: [p], color, width } });
    const ctx = canvasRef.current.getContext("2d");
    drawStroke(ctx, { color, width, path: pathRef.current });
    socket.emit("cursor-move", { roomId, x: p.x, y: p.y });
  }
  function end(e) {
    if (!isDrawing || !socket) return;
    setIsDrawing(false);
    const command = {
      type: "stroke",
      data: { path: pathRef.current, color, width },
      timestamp: new Date(),
    };
    socket.emit("draw-end", { roomId, command });
    pathRef.current = [];
  }

  function clearCanvas() {
    const ctx = canvasRef.current.getContext("2d");
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    if (socket) socket.emit("clear-canvas", { roomId });
  }

  return (
    <div
      style={{ width: "100%", height: "100%" }}
      onMouseLeave={() => {
        if (socket) socket.emit("cursor-move", { roomId, x: -1, y: -1 });
      }}
    >
      <canvas
        ref={canvasRef}
        style={{ width: "100%", height: "100%" }}
        onMouseDown={start}
        onMouseMove={draw}
        onMouseUp={end}
        onTouchStart={start}
        onTouchMove={draw}
        onTouchEnd={end}
      />
      <div
        style={{
          position: "absolute",
          left: 8,
          top: 8,
          background: "rgba(255,255,255,0.9)",
          padding: 6,
          borderRadius: 4,
          fontSize: "12px",
        }}
      >
        <div>
          Color:{" "}
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            style={{ width: "40px", height: "20px" }}
          />
        </div>
        <div>
          Width:{" "}
          <input
            className="slider"
            type="range"
            min="1"
            max="12"
            value={width}
            onChange={(e) => setWidth(parseInt(e.target.value))}
          />
        </div>
        <button
          className="btn"
          style={{ fontSize: "12px", padding: "4px 8px", marginTop: "4px" }}
          onClick={clearCanvas}
        >
          Clear
        </button>
      </div>
    </div>
  );
}
