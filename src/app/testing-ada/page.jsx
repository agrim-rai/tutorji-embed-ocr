"use client";
import { useState } from "react";

export default function AdaTesting() {
  // State for manual text operations
  const [docId, setDocId] = useState("");
  const [results, setResults] = useState([]);
  const [busy, setBusy] = useState(false);
  const [resultImages, setResultImages] = useState({});

  // State for image operations
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [ocrText, setOcrText] = useState("");
  const [editableOcrText, setEditableOcrText] = useState("");
  const [imageBusy, setImageBusy] = useState(false);

  // State for manual document addition with image
  const [manualDocImage, setManualDocImage] = useState(null);
  const [manualDocImagePreview, setManualDocImagePreview] = useState("");
  const [manualDocBusy, setManualDocBusy] = useState(false);

  // State for image comparison
  const [comparisonResult, setComparisonResult] = useState(null);
  const [comparisonBusy, setComparisonBusy] = useState(false);

  // Dummy user data (replace with actual user data in production)
  const userData = {
    userId: "68397443be4ec81a80dbed6f",
    userEmail: "agrimforworld@gmail.com",
    pageName: "/testing-ada"
  };

  // Convert file to base64
  function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  }

  // Get confidence color based on percentage
  function getConfidenceColor(confidence) {
    const percentage = confidence * 100;
    if (percentage >= 80) return "#28a745"; // Green
    if (percentage >= 60) return "#ffc107"; // Yellow
    if (percentage >= 40) return "#fd7e14"; // Orange
    return "#dc3545"; // Red
  }

  // Handle image file selection for OCR
  function handleImageSelect(e) {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);
      setOcrText(""); // Clear previous OCR text
    }
  }

  // Handle image file selection for manual document addition
  function handleManualDocImageSelect(e) {
    const file = e.target.files[0];
    if (file) {
      setManualDocImage(file);
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => setManualDocImagePreview(e.target.result);
      reader.readAsDataURL(file);
    }
  }

  // Process image with OCR using base64
  async function handleImageOCR() {
    if (!selectedImage) return;
    
    setImageBusy(true);
    try {
      // Convert image to base64
      const base64Image = await fileToBase64(selectedImage);

      const response = await fetch('/api/ocr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          base64Image: base64Image,
          userId: userData.userId,
          userEmail: userData.userEmail,
          pageName: userData.pageName
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        setOcrText(result.data.text);
        setEditableOcrText(result.data.text); // Set editable text same as OCR result
        // alert("OCR processing completed!");
      } else {
        throw new Error(result.error || "OCR processing failed");
      }
    } catch (error) {
      console.error("OCR Error:", error);
      alert(`OCR failed: ${error.message}`);
    } finally {
      setImageBusy(false);
    }
  }

  // Compare current image with top search result
  async function handleImageComparison(topResultId) {
    if (!selectedImage || !topResultId) return;
    
    setComparisonBusy(true);
    setComparisonResult(null);
    
    try {
      // Convert current image to base64
      const userImageBase64 = await fileToBase64(selectedImage);
      
      const response = await fetch('/api/compare-images', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topResultId: topResultId,
          userImageBase64: userImageBase64
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        setComparisonResult(result.comparison);
      } else {
        throw new Error(result.error || "Image comparison failed");
      }
    } catch (error) {
      console.error("Image Comparison Error:", error);
      alert(`Image comparison failed: ${error.message}`);
    } finally {
      setComparisonBusy(false);
    }
  }

  // Search similar text using editable OCR result
  async function handleSearchOCR() {
    if (!editableOcrText) return;
    
    setBusy(true);
    setResultImages({}); // Clear previous images
    try {
      const response = await fetch(
        `/api/vectors?q=${encodeURIComponent(editableOcrText)}&k=5`
      );
      const json = await response.json();
      const searchResults = json.results || [];
      setResults(searchResults);
      
      // Automatically trigger image comparison if there's a top result and user has uploaded an image
      if (json.topResult && selectedImage) {
        setTimeout(() => {
          handleImageComparison(json.topResult.id);
        }, 500); // Small delay to ensure UI updates
      }

      // Fetch images for the search results
      if (searchResults.length > 0) {
        const adaIds = searchResults.map(r => r.id).join(',');
        try {
          const imageResponse = await fetch(`/api/ada-store/multiple?adaIds=${encodeURIComponent(adaIds)}`);
          const imageJson = await imageResponse.json();
          
          if (imageJson.success) {
            const imageMap = {};
            imageJson.data.forEach(item => {
              imageMap[item.adaId] = item.imageBase64;
            });
            setResultImages(imageMap);
          }
        } catch (imageError) {
          console.error("Error fetching images:", imageError);
          // Continue without images
          setResultImages({});
        }
      } else {
        setResultImages({});
      }
    } catch (error) {
      console.error("Search Error:", error);
      alert("Search failed");
    } finally {
      setBusy(false);
    }
  }

  // Add editable OCR text to vector store
  async function handleAddOCRToStore() {
    if (!editableOcrText || !selectedImage) return;
    
    const docIdForOCR = `ocr_${Date.now()}`;
    setBusy(true);
    
    try {
      // Convert image to base64 for storage
      const base64Image = await fileToBase64(selectedImage);

      // First, add text to vector store
      const vectorResponse = await fetch("/api/vectors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          id: docIdForOCR, 
          text: editableOcrText 
        }),
      });
      
      if (!vectorResponse.ok) {
        throw new Error("Failed to add to vector store");
      }

      // Then, store the image with the Ada ID in MongoDB
      const adaStoreResponse = await fetch("/api/ada-store", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          adaId: docIdForOCR, 
          imageBase64: base64Image 
        }),
      });
      
      if (!adaStoreResponse.ok) {
        throw new Error("Failed to store image in database");
      }

      alert(`OCR text and image added to vector store with ID: ${docIdForOCR}`);
    } catch (error) {
      console.error("Add Error:", error);
      alert(`Failed to add OCR text to store: ${error.message}`);
    } finally {
      setBusy(false);
    }
  }

  // Manual document addition using image upload
  async function handleAddManualDoc() {
    if (!docId || !manualDocImage) {
      alert("Please provide both Document ID and select an image");
      return;
    }
    
    setManualDocBusy(true);
    try {
      // Convert image to base64
      const base64Image = await fileToBase64(manualDocImage);

      // First, extract text from image using OCR API
      const ocrResponse = await fetch('/api/ocr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          base64Image: base64Image,
          userId: userData.userId,
          userEmail: userData.userEmail,
          pageName: userData.pageName
        }),
      });

      const ocrResult = await ocrResponse.json();
      
      if (!ocrResult.success) {
        throw new Error(ocrResult.error || "OCR processing failed");
      }

      // Then add the extracted text to vector store with custom ID
      const vectorResponse = await fetch("/api/vectors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          id: docId, 
          text: ocrResult.data.text 
        }),
      });
      
      if (!vectorResponse.ok) {
        throw new Error("Failed to add to vector store");
      }

      // Store the image with the Ada ID in MongoDB
      const adaStoreResponse = await fetch("/api/ada-store", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          adaId: docId, 
          imageBase64: base64Image 
        }),
      });
      
      if (!adaStoreResponse.ok) {
        throw new Error("Failed to store image in database");
      }

      setDocId("");
      setManualDocImage(null);
      setManualDocImagePreview("");
      alert(`Document and image added to vector store with ID: ${docId}`);
    } catch (error) {
      console.error("Add Error:", error);
      alert(`Failed to add document: ${error.message}`);
    } finally {
      setManualDocBusy(false);
    }
  }

  // Manual search (existing functionality)
  async function handleSearch() {
    if (!query) return;
    setBusy(true);
    setResultImages({}); // Clear previous images
    try {
      const resp = await fetch(
        `/api/vectors?q=${encodeURIComponent(query)}&k=5`
      );
      const json = await resp.json();
      const searchResults = json.results || [];
      setResults(searchResults);
      
      // Automatically trigger image comparison if there's a top result and user has uploaded an image
      if (json.topResult && selectedImage) {
        setTimeout(() => {
          handleImageComparison(json.topResult.id);
        }, 500); // Small delay to ensure UI updates
      }

      // Fetch images for the search results
      if (searchResults.length > 0) {
        const adaIds = searchResults.map(r => r.id).join(',');
        try {
          const imageResponse = await fetch(`/api/ada-store/multiple?adaIds=${encodeURIComponent(adaIds)}`);
          const imageJson = await imageResponse.json();
          
          if (imageJson.success) {
            const imageMap = {};
            imageJson.data.forEach(item => {
              imageMap[item.adaId] = item.imageBase64;
            });
            setResultImages(imageMap);
          }
        } catch (imageError) {
          console.error("Error fetching images:", imageError);
          // Continue without images
          setResultImages({});
        }
      } else {
        setResultImages({});
      }
    } catch (err) {
      console.error(err);
      alert("Search failed");
    } finally {
      setBusy(false);
    }
  }

  // State for manual search
  const [query, setQuery] = useState("");

  return (
    <div style={pageStyle}>
      <h1 style={titleStyle}> Image OCR + Vector Search</h1>

      {/* Image Upload and OCR Section */}
      <section style={sectionStyle}>
        <h2 style={sectionTitleStyle}>Upload Image for OCR</h2>
        
        <input
          type="file"
          accept="image/*"
          onChange={handleImageSelect}
          style={fileInputStyle}
        />
        
        {imagePreview && (
          <div style={imagePreviewContainerStyle}>
            <img 
              src={imagePreview} 
              alt="Preview" 
              style={imagePreviewStyle}
            />
          </div>
        )}
        
        <div style={buttonGroupStyle}>
          <button 
            style={buttonStyle} 
            onClick={handleImageOCR} 
            disabled={!selectedImage || imageBusy}
          >
            {imageBusy ? "Processing..." : "Extract Text (OCR)"}
          </button>
        </div>
        
        {ocrText && (
          <div style={ocrResultStyle}>
            <h3 style={subTitleStyle}>Extracted Text (Editable):</h3>
            <textarea
              style={editableTextAreaStyle}
              value={editableOcrText}
              onChange={(e) => setEditableOcrText(e.target.value)}
              placeholder="Edit the extracted text here..."
              rows={8}
            />
            
            <div style={buttonGroupStyle}>
              <button 
                style={buttonStyle} 
                onClick={handleSearchOCR} 
                disabled={busy || !editableOcrText.trim()}
              >
                {busy ? "Searching..." : "Search Similar Text"}
              </button>
              
              {comparisonBusy && (
                <div style={statusIndicatorStyle}>
                  🔍 Comparing images with AI...
                </div>
              )}
              
              <button 
                style={{...buttonStyle, backgroundColor: "#28a745"}} 
                onClick={handleAddOCRToStore} 
                disabled={busy || !editableOcrText.trim() || !selectedImage}
              >
                  {busy ? "Adding..." : "Add Text & Image to Store"}
              </button>
              
              {results.length > 0 && (
                <button 
                  style={{...buttonStyle, backgroundColor: "#6f42c1"}} 
                  onClick={() => handleImageComparison(results[0].id)} 
                  disabled={comparisonBusy || !selectedImage}
                >
                  {comparisonBusy ? "Comparing..." : "Compare with Top Result"}
                </button>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Image Comparison Results Section */}
      {comparisonResult && (
        <section style={sectionStyle}>
          <h2 style={sectionTitleStyle}>🔍 Image Comparison Result</h2>
          
          <div style={comparisonResultStyle}>
            {/* Match Status Card */}
            {/* <div style={matchStatusCardStyle}>
              <div style={matchStatusIconStyle}>
                {comparisonResult.areSame ? "✅" : "❌"}
              </div>
              <div style={matchStatusTextStyle}>
                <div style={matchTitleStyle}>
                  {comparisonResult.areSame ? "MATCH FOUND" : "NO MATCH"}
                </div>
                <div style={matchSubtitleStyle}>
                  {comparisonResult.areSame ? "Images are similar" : "Images are different"}
                </div>
              </div>
            </div> */}

            {/* Confidence Meter */}
            {/* <div style={confidenceMeterContainerStyle}>
              <div style={confidenceLabelStyle}>
                Confidence Level
              </div>
              <div style={confidenceMeterStyle}>
                <div 
                  style={{
                    ...confidenceBarStyle,
                    width: `${Math.round(comparisonResult.confidence * 100)}%`,
                    backgroundColor: getConfidenceColor(comparisonResult.confidence)
                  }}
                />
              </div>
              <div style={confidencePercentageStyle}>
                {Math.round(comparisonResult.confidence * 100)}%
              </div>
            </div> */}
            
            <div style={explanationStyle}>
              <strong>AI Analysis:</strong> {comparisonResult.explanation}
            </div>
            
            {selectedImage && (
              <div style={buttonGroupStyle}>
                <button 
                  style={buttonStyle} 
                  onClick={() => results.length > 0 && handleImageComparison(results[0].id)} 
                  disabled={comparisonBusy || !selectedImage || results.length === 0}
                >
                  {comparisonBusy ? "Comparing..." : "Compare Again"}
                </button>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Manual Document Addition Section with Image Upload */}
      {/* <section style={sectionStyle}>
        <h2 style={sectionTitleStyle}>➕ Add Document with Image</h2>
        <input
          style={inputStyle}
          placeholder="Document ID"
          value={docId}
          onChange={(e) => setDocId(e.target.value)}
        />
        
        <input
          type="file"
          accept="image/*"
          onChange={handleManualDocImageSelect}
          style={fileInputStyle}
        />
        
        {manualDocImagePreview && (
          <div style={imagePreviewContainerStyle}>
            <img 
              src={manualDocImagePreview} 
              alt="Document Preview" 
              style={imagePreviewStyle}
            />
          </div>
        )}
        
        <button 
          style={buttonStyle} 
          onClick={handleAddManualDoc} 
          disabled={manualDocBusy || !docId || !manualDocImage}
        >
          {manualDocBusy ? "Processing & Adding..." : "Extract Text & Add Document"}
        </button>
      </section> */}

      {/* Manual Search Section */}
      {/* <section style={sectionStyle}>
        <h2 style={sectionTitleStyle}>🔍 Manual Search</h2>
        <input
          style={inputStyle}
          placeholder="Your query…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button style={buttonStyle} onClick={handleSearch} disabled={busy}>
          {busy ? "Searching…" : "Search"}
        </button>
      </section> */}

      {/* Search Results Section */}
      {results.length > 0 && (
        <section style={sectionStyle}>
          <h2 style={sectionTitleStyle}>Search Results</h2>
          <ul style={{ listStyle: "none", padding: 0, marginTop: "1rem" }}>
            {results.map((r, i) => (
              <li key={i} style={resultItemStyle}>
                <div style={resultHeaderStyle}>
                  <strong style={resultIdStyle}>ID: {r.id}</strong>
                  <span style={scoreStyle}>Score: {r.score.toFixed(4)}</span>
                </div>
                
                {/* Display image if available */}
                {resultImages[r.id] && (
                  <div style={resultImageContainerStyle}>
                    <img 
                      src={resultImages[r.id]} 
                      alt={`Image for ${r.id}`}
                      style={resultImageStyle}
                    />
                  </div>
                )}
                
                <div style={resultTextStyle}>
                  {r.text}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

// Dark mode styles
const pageStyle = {
  padding: "2rem",
  fontFamily: "Segoe UI, sans-serif",
  backgroundColor: "#121212",
  minHeight: "100vh",
  color: "#f8f9fa",
  maxWidth: "1200px",
  margin: "0 auto",
};

const titleStyle = {
  textAlign: "center",
  marginBottom: "2rem",
  color: "#ffffff",
  fontSize: "2rem",
};

const sectionStyle = {
  backgroundColor: "#1e1e1e",
  padding: "1.5rem",
  borderRadius: "12px",
  boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
  marginBottom: "2rem",
  border: "1px solid #333",
};

const sectionTitleStyle = {
  marginBottom: "1rem",
  color: "#e9ecef",
  fontSize: "1.3rem",
};

const subTitleStyle = {
  marginBottom: "0.5rem",
  color: "#e9ecef",
  fontSize: "1.1rem",
};

const inputStyle = {
  width: "100%",
  padding: "0.75rem",
  marginBottom: "1rem",
  borderRadius: "8px",
  border: "1px solid #444",
  backgroundColor: "#2a2a2a",
  color: "#ffffff",
  fontSize: "1rem",
  boxSizing: "border-box",
};

const fileInputStyle = {
  width: "100%",
  padding: "0.75rem",
  marginBottom: "1rem",
  borderRadius: "8px",
  border: "1px solid #444",
  backgroundColor: "#2a2a2a",
  color: "#ffffff",
  fontSize: "1rem",
  cursor: "pointer",
};

const buttonStyle = {
  padding: "0.75rem 1.5rem",
  fontSize: "1rem",
  backgroundColor: "#0d6efd",
  color: "white",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  marginRight: "1rem",
  marginBottom: "0.5rem",
};

const buttonGroupStyle = {
  display: "flex",
  flexWrap: "wrap",
  gap: "0.5rem",
  marginTop: "1rem",
};

const imagePreviewContainerStyle = {
  marginBottom: "1rem",
  textAlign: "center",
};

const imagePreviewStyle = {
  maxWidth: "100%",
  maxHeight: "300px",
  borderRadius: "8px",
  border: "1px solid #444",
};

const ocrResultStyle = {
  marginTop: "1rem",
  padding: "1rem",
  backgroundColor: "#2a2a2a",
  borderRadius: "8px",
  border: "1px solid #444",
};

const textAreaStyle = {
  width: "100%",
  minHeight: "120px",
  padding: "0.75rem",
  backgroundColor: "#1a1a1a",
  color: "#ffffff",
  border: "1px solid #555",
  borderRadius: "8px",
  fontSize: "0.9rem",
  lineHeight: "1.4",
  marginBottom: "1rem",
  whiteSpace: "pre-wrap",
  wordWrap: "break-word",
};

const editableTextAreaStyle = {
  width: "100%",
  minHeight: "150px",
  padding: "0.75rem",
  backgroundColor: "#2a2a2a",
  color: "#ffffff",
  border: "1px solid #555",
  borderRadius: "8px",
  fontSize: "0.9rem",
  lineHeight: "1.4",
  marginBottom: "1rem",
  resize: "vertical",
  fontFamily: "inherit",
  boxSizing: "border-box",
};

const resultItemStyle = {
  background: "#2c2f33",
  padding: "1rem",
  borderRadius: "8px",
  marginBottom: "0.75rem",
  color: "#ffffff",
  border: "1px solid #444",
};

const resultHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "0.5rem",
};

const resultIdStyle = {
  color: "#17a2b8",
  fontSize: "0.9rem",
};

const scoreStyle = {
  color: "#28a745",
  fontSize: "0.8rem",
  fontWeight: "bold",
};

const resultTextStyle = {
  fontSize: "0.9rem",
  lineHeight: "1.4",
  color: "#e9ecef",
};

const resultImageContainerStyle = {
  marginBottom: "1rem",
  textAlign: "center",
};

const resultImageStyle = {
  maxWidth: "100%",
  maxHeight: "200px",
  borderRadius: "8px",
  border: "1px solid #555",
  objectFit: "contain",
};

const comparisonResultStyle = {
  backgroundColor: "#2a2a2a",
  padding: "1.5rem",
  borderRadius: "8px",
  border: "1px solid #444",
};

// Match Status Card Styles
const matchStatusCardStyle = {
  display: "flex",
  alignItems: "center",
  backgroundColor: "#1a1a1a",
  padding: "1rem",
  borderRadius: "8px",
  marginBottom: "1.5rem",
  border: "1px solid #555",
};

const matchStatusIconStyle = {
  fontSize: "2rem",
  marginRight: "1rem",
};

const matchStatusTextStyle = {
  flex: 1,
};

const matchTitleStyle = {
  fontSize: "1.2rem",
  fontWeight: "bold",
  color: "#ffffff",
  marginBottom: "0.25rem",
};

const matchSubtitleStyle = {
  fontSize: "0.9rem",
  color: "#adb5bd",
};

// Confidence Meter Styles
const confidenceMeterContainerStyle = {
  marginBottom: "1rem",
};

const confidenceLabelStyle = {
  fontSize: "0.9rem",
  color: "#e9ecef",
  marginBottom: "0.5rem",
  fontWeight: "500",
};

const confidenceMeterStyle = {
  width: "100%",
  height: "8px",
  backgroundColor: "#444",
  borderRadius: "4px",
  overflow: "hidden",
  marginBottom: "0.5rem",
};

const confidenceBarStyle = {
  height: "100%",
  borderRadius: "4px",
  transition: "width 0.5s ease",
};

const confidencePercentageStyle = {
  fontSize: "1.1rem",
  fontWeight: "bold",
  color: "#ffffff",
  textAlign: "center",
};

const explanationStyle = {
  fontSize: "0.95rem",
  lineHeight: "1.5",
  color: "#e9ecef",
  marginBottom: "1rem",
  padding: "1rem",
  backgroundColor: "#1a1a1a",
  borderRadius: "6px",
  border: "1px solid #555",
};

const statusIndicatorStyle = {
  padding: "0.5rem 1rem",
  backgroundColor: "#17a2b8",
  color: "white",
  borderRadius: "6px",
  fontSize: "0.9rem",
  fontWeight: "bold",
  textAlign: "center",
  marginTop: "0.5rem",
};
