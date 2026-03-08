import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import './App.css';

// 1. UPDATE THIS TO YOUR LIVE RENDER URL
const API_URL = "https://hr-intelligence-backend.onrender.com";

function App() {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // 2. FETCH CANDIDATES FROM THE CLOUD
  const fetchCandidates = async () => {
    try {
      const response = await fetch(`${API_URL}/candidates`);
      const data = await response.json();
      setCandidates(data);
    } catch (error) {
      console.error("Failed to fetch candidates:", error);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, []);

  // 3. HANDLE BULK UPLOADS (FIXED 'RES' TYPO)
  const handleUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setLoading(true);
    const uploadPromises = Array.from(files).map(async (file) => {
      const formData = new FormData();
      formData.append('file', file);

      try {
        const response = await fetch(`${API_URL}/upload-resume`, {
          method: 'POST',
          body: formData,
        });
        return await response.json();
      } catch (error) {
        console.error(`Error uploading ${file.name}:`, error);
        return { message: "Failed" };
      }
    });

    await Promise.all(uploadPromises);
    setLoading(false);
    fetchCandidates(); // Refresh the table
  };

  // 4. DELETE A CANDIDATE
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this candidate?")) return;
    try {
      await fetch(`${API_URL}/candidates/${id}`, { method: 'DELETE' });
      fetchCandidates();
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };

  // 5. EXPORT SHORTLISTED TO EXCEL
  const exportToExcel = () => {
    const shortlisted = candidates.filter(c => c.score >= 4 || c.status === "Shortlisted");
    
    if (shortlisted.length === 0) {
      alert("No shortlisted candidates to export!");
      return;
    }

    const exportData = shortlisted.map(c => ({
      "Candidate Name": c.real_name,
      "Email Address": c.email,
      "Phone Number": c.phone,
      "AI Score": c.score,
      "Status": c.status,
      "File Name": c.filename
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Shortlisted");
    XLSX.writeFile(workbook, "HR_Shortlisted_Candidates.xlsx");
  };

  // 6. FILTER LOGIC
  const filteredCandidates = candidates.filter(c => 
    c.real_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="app-container">
      <header className="glass-header">
        <h1>🤖 HR Intelligence Portal</h1>
        <p>AI-Powered Resume Screening & Grading</p>
      </header>

      <main className="dashboard">
        <div className="controls-card glass">
          <div className="upload-section">
            <label className="upload-btn">
              📁 Bulk Upload Resumes
              <input type="file" multiple onChange={handleUpload} hidden />
            </label>
            {loading && <span className="loader">Processing AI Analysis...</span>}
          </div>

          <div className="action-section">
            <input 
              type="text" 
              placeholder="Search candidates..." 
              className="search-input"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button className="export-btn" onClick={exportToExcel}>
              📥 Export Shortlisted (Excel)
            </button>
          </div>
        </div>

        <div className="table-container glass">
          <table>
            <thead>
              <tr>
                <th>Candidate Name</th>
                <th>Contact Info</th>
                <th>AI Score</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCandidates.map((c) => (
                <tr key={c.id}>
                  <td>
                    <strong>{c.real_name}</strong>
                    <br />
                    <small>{c.filename}</small>
                  </td>
                  <td>
                    {c.email} <br />
                    {c.phone}
                  </td>
                  <td>
                    <span className={`score-badge score-${c.score}`}>
                      {Array(c.score).fill("⭐").join("")}
                    </span>
                  </td>
                  <td>
                    <span className={`status-pill ${c.status.toLowerCase()}`}>
                      {c.status}
                    </span>
                  </td>
                  <td>
                    <button className="delete-btn" onClick={() => handleDelete(c.id)}>🗑️</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}

export default App;
