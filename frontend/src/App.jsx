import { useState, useEffect, useRef } from "react"
import axios from "axios"

const API_URL = import.meta.env.VITE_API_URL

export default function App() {
  const [files, setFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState(null)
  const fileInputRef = useRef(null)

  const fetchFiles = async () => {
    try {
      const res = await axios.get(`${API_URL}/files`)
      setFiles(res.data)
    } catch {
      setMessage({ type: "error", text: "Cannot reach API" })
    }
  }

  useEffect(() => {
    fetchFiles()
    const interval = setInterval(fetchFiles, 10000)
    return () => clearInterval(interval)
  }, [])

  const handleUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    const formData = new FormData()
    formData.append("file", file)
    try {
      await axios.post(`${API_URL}/upload`, formData)
      setMessage({ type: "success", text: `Uploaded ${file.name}` })
      fetchFiles()
    } catch {
      setMessage({ type: "error", text: "Upload failed" })
    }
    setUploading(false)
  }

  const handleDelete = async (key) => {
    try {
      await axios.delete(`${API_URL}/files/${key}`)
      setMessage({ type: "success", text: `Deleted ${key}` })
      fetchFiles()
    } catch {
      setMessage({ type: "error", text: "Delete failed" })
    }
  }

  const handleDownload = async (key) => {
    try {
      const res = await axios.get(`${API_URL}/download/${key}`)
      window.open(res.data.url, "_blank")
    } catch {
      setMessage({ type: "error", text: "Download failed" })
    }
  }

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a1a", color: "white", fontFamily: "monospace", padding: "40px" }}>
      <div style={{ marginBottom: "40px" }}>
        <h1 style={{ fontSize: "28px", color: "#00ff88", margin: 0, letterSpacing: "4px" }}>HOMELAB BACKUP</h1>
        <div style={{ color: "#888", fontSize: "12px", marginTop: "8px" }}>Automated S3 File Backup System</div>
      </div>

      {message && (
        <div style={{
          background: message.type === "success" ? "#00ff8820" : "#ff444420",
          border: `1px solid ${message.type === "success" ? "#00ff88" : "#ff4444"}`,
          borderRadius: "8px",
          padding: "12px 20px",
          marginBottom: "24px",
          color: message.type === "success" ? "#00ff88" : "#ff4444",
          fontSize: "13px"
        }}>
          {message.text}
          <span onClick={() => setMessage(null)} style={{ float: "right", cursor: "pointer" }}>✕</span>
        </div>
      )}

      <div style={{ marginBottom: "32px" }}>
        <button
          onClick={() => fileInputRef.current.click()}
          disabled={uploading}
          style={{
            background: uploading ? "#333" : "#00ff88",
            color: "#0a0a1a",
            border: "none",
            borderRadius: "8px",
            padding: "12px 24px",
            fontSize: "13px",
            fontFamily: "monospace",
            fontWeight: "bold",
            cursor: uploading ? "not-allowed" : "pointer",
            letterSpacing: "2px"
          }}>
          {uploading ? "UPLOADING..." : "↑ UPLOAD FILE"}
        </button>
        <input ref={fileInputRef} type="file" onChange={handleUpload} style={{ display: "none" }} />
      </div>

      <div style={{ background: "#1a1a2e", border: "1px solid #16213e", borderRadius: "12px", overflow: "hidden" }}>
        <div style={{ padding: "16px 24px", borderBottom: "1px solid #16213e", display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: "#888", fontSize: "11px", letterSpacing: "2px" }}>BACKED UP FILES</span>
          <span style={{ color: "#888", fontSize: "11px" }}>{files.length} files</span>
        </div>

        {files.length === 0 ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#888", fontSize: "13px" }}>
            No files backed up yet
          </div>
        ) : (
          files.map((file, i) => (
            <div key={i} style={{
              padding: "16px 24px",
              borderBottom: "1px solid #16213e",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}>
              <div>
                <div style={{ color: "#00ff88", fontSize: "13px" }}>{file.key}</div>
                <div style={{ color: "#888", fontSize: "11px", marginTop: "4px" }}>
                  {formatSize(file.size)} · {new Date(file.last_modified).toLocaleString()}
                </div>
              </div>
              <div style={{ display: "flex", gap: "12px" }}>
                <button onClick={() => handleDownload(file.key)} style={{
                  background: "transparent", border: "1px solid #00ff88", color: "#00ff88",
                  borderRadius: "6px", padding: "6px 14px", fontSize: "11px",
                  fontFamily: "monospace", cursor: "pointer", letterSpacing: "1px"
                }}>↓ GET</button>
                <button onClick={() => handleDelete(file.key)} style={{
                  background: "transparent", border: "1px solid #ff4444", color: "#ff4444",
                  borderRadius: "6px", padding: "6px 14px", fontSize: "11px",
                  fontFamily: "monospace", cursor: "pointer", letterSpacing: "1px"
                }}>✕ DEL</button>
              </div>
            </div>
          ))
        )}
      </div>

      <div style={{ marginTop: "40px", color: "#333", fontSize: "11px" }}>
        STORAGE: AWS S3 — us-east-1 · NODE: midnight-coast-media
      </div>
    </div>
  )
}