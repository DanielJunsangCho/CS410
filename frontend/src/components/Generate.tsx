import React, { useState } from 'react';
import GeneratePopup from './GeneratePopup';

const Generate: React.FC = () => {
  const [showPopup, setShowPopup] = useState(false);
  const [plot, setPlot] = useState<string | null>(null);

  const handleGenerateClick = () => {
    setShowPopup(true);
  };

  const handleClosePopup = () => {
    setShowPopup(false);
  };

  const handleGenerateData = async (data: {
    rows: number;
    cols: number;
    numTransmitters: number;
    mean: number;
    sd: number;
    bandwidth: number;
    activeTime: number;
    matrixFilename: string;
    transmittersFilename: string;
  }) => {
    console.log("Generate data with:", data);
    try {
      const response = await fetch('http://127.0.0.1:5000/generate', { // Update URL to match backend
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const result = await response.json();
        console.log(result.message);
        setPlot(result.plot); // Set plot data to state
        // Handle success (e.g., display a success message or update the UI)
      } else {
        const error = await response.json();
        console.error(error.error);
        // Handle error (e.g., display an error message)
      }
    } catch (error) {
      console.error('Error:', error);
      // Handle error (e.g., display an error message)
    }
  };

  return (
    <>
      <button className="generate-button" onClick={handleGenerateClick}>
        Generate
      </button>
      {showPopup && (
        <GeneratePopup onClose={handleClosePopup} onGenerate={handleGenerateData} />
      )}
      {plot && (
        <div>
          <img src={`data:image/png;base64,${plot}`} alt="Generated Plot" />
        </div>
      )}
    </>
  );
};

export default Generate;