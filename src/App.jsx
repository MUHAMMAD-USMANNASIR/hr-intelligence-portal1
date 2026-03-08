import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import './App.css';
const API_URL = "https://hr-intelligence-backend.onrender.com";function App() {
  const [candidates, setCandidates] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchCandidates = async () => {
    try {
      const response = await fetch(`${API_URL}/candidates`);
      const data = await res.json();
      setCandidates(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch:", err);
    }
  };

  useEffect(() => { fetchCandidates(); }, []);

  const handleUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setLoading(true);

    // Create an array of upload tasks for every single file selected
    const uploadPromises = Array.from(files).map(async (file) => {
      const formData = new FormData();
      formData.append('file', file);
      
      // Send each file to your Python server
      return fetch('http://127.0.0.1:8000/upload-resume', { 
        method: 'POST', 
        body: formData 
      });
    });

    // Wait for all files to finish processing in parallel
    await Promise.all(uploadPromises);
    
    setLoading(false);
    fetchCandidates(); // Refresh the table once all 50+ files are done!
  };

  const deleteCandidate = async (id) => {
    await fetch(`http://127.0.0.1:8000/candidates/${id}`, { method: 'DELETE' });
    fetchCandidates();
  };

  const exportToExcel = () => {
    // 1. Grab only the shortlisted candidates
    const shortlisted = candidates.filter(c => c.score >= 4 || c.status === "Shortlisted");
    
    if (shortlisted.length === 0) {
      alert("No shortlisted candidates to export yet!");
      return;
    }

    // 2. Format the exact columns we want in the Excel sheet
    const exportData = shortlisted.map(c => ({
      "Candidate Name": c.real_name || "Unknown",
      "Email Address": c.email || "No Email",
      "Phone Number": c.phone || "No Phone",
      "AI Score": c.score,
      "Status": c.status,
      "Original File": c.filename
    }));

    // 3. Build and download the Excel file
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Shortlisted Candidates");
    XLSX.writeFile(workbook, "HR_Shortlisted_Candidates.xlsx");
  };

  const filtered = candidates.filter(c => {
    // We use a fallback just in case a resume has no name extracted at all
    const searchableName = c.real_name || c.filename || "";
    return searchableName.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="App pro-dashboard">
      <header>
        <h1>HR Intelligence Portal</h1>
        <div className="header-actions">
          <input 
            className="search-bar"
            placeholder="Search candidates..." 
            onChange={(e) => setSearch(e.target.value)} 
          />
          <button className="export-btn" onClick={exportToExcel}>
            📊 Export Shortlisted
          </button>
        </div>
      </header>

      <div className="upload-container">
        <label className="custom-upload">
          {loading ? "Processing Bulk Analysis..." : "📤 Drag & Drop Multiple Resumes Here"}
          <input type="file" multiple onChange={handleUpload} hidden />
        </label>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Candidate Info</th>
              <th>AI Score</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(c => (
              <tr key={c.id} className={c.score >= 4 ? 'gold-row' : ''}>
                <td>
                  <strong>{c.real_name}</strong><br/>
                  <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>✉️ {c.email}</span><br/>
                  <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>📞 {c.phone}</span>
                </td>
                <td>{"⭐".repeat(c.score)}</td>
                <td>
                  <span className={`badge ${c.status ? c.status.replace(/\s+/g, '') : 'Unknown'}`}>
                    {c.status || "Unknown"}
                  </span>
                </td>
                <td><button className="del-btn" onClick={() => deleteCandidate(c.id)}>Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default App;