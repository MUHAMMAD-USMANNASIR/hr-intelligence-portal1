import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import './App.css';

// YOUR LIVE RENDER URL
const API_URL = "https://hr-intelligence-backend.onrender.com";

function App() {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

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
        return await response.json(); // Fixed the 'res' error here
      } catch (error) {
        console.error(`Error uploading ${file.name}:`, error);
        return { message: "Failed" };
      }
    });

    await Promise.all(uploadPromises);
    setLoading(false);
    fetchCandidates(); 
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure?")) return;
    try {
      await fetch(`${API_URL}/candidates/${id}`, { method: 'DELETE' });
      fetchCandidates();
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };

  const exportToExcel = () => {
    const shortlisted = candidates.filter(c => c.score >= 4);
    if (shortlisted.length === 0) {
      alert("No shortlisted candidates!");
      return;
    }
    const worksheet = XLSX.utils.json_to_sheet(shortlisted);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Shortlisted");
    XLSX.writeFile(workbook, "Shortlisted_Candidates.xlsx");
  };

  const filteredCandidates = candidates.filter(c => 
    c.real_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="app-container">
      <header className="glass-header">
        <h1>🤖 HR Intelligence Portal</h1>
        <p>AI-Powered Resume Screening</p>
      </header>
      <main className="dashboard">
        <div className="controls-card glass">
          <label className="upload-btn">
            📁 Bulk Upload Resumes
            <input type="file" multiple onChange={handleUpload} hidden />
          </label>
          {loading && <p>AI is processing files...</p>}
          <div className="action-section">
            <input 
              type="text" 
              placeholder="Search..." 
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button className="export-btn" onClick={exportToExcel}>Export (Excel)</button>
          </div>
        </div>
        <div className="table-container glass">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Contact</th>
                <th>Score</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCandidates.map((c) => (
                <tr key={c.id}>
                  <td>{c.real_name}</td>
                  <td>{c.email}</td>
                  <td>{"⭐".repeat(c.score)}</td>
                  <td>{c.status}</td>
                  <td><button onClick={() => handleDelete(c.id)}>🗑️</button></td>
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
