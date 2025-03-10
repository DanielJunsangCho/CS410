import React, { useState } from 'react';

interface GeneratePopupProps {
  onClose: () => void;
  onGenerate: (data: {
    rows: number;
    cols: number;
    numTransmitters: number;
    mean: number;
    sd: number;
    bandwidth: number;
    activeTime: number;
    matrixFilename: string;
    transmittersFilename: string;
  }) => void;
}

const GeneratePopup: React.FC<GeneratePopupProps> = ({ onClose, onGenerate }) => {
  const [rows, setRows] = useState<number>(1000);
  const [cols, setCols] = useState<number>(1024);
  const [numTransmitters, setNumTransmitters] = useState<number>(5);
  const [mean, setMean] = useState<number>(-75);
  const [sd, setSd] = useState<number>(2);
  const [bandwidth, setBandwidth] = useState<number>(200);
  const [activeTime, setActiveTime] = useState<number>(10);
  const [matrixFilename, setMatrixFilename] = useState<string>('output_matrix.csv');
  const [transmittersFilename, setTransmittersFilename] = useState<string>('output_transmitters.csv');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = ({
      rows,
      cols,
      numTransmitters,
      mean,
      sd,
      bandwidth,
      activeTime,
      matrixFilename,
      transmittersFilename,
    });
    console.log("Form submitted with data:", formData); // Debugging print statement
    onGenerate(formData);
    onClose();
  };

  return (
    <div className="popup-overlay">
      <div className="popup-content">
        <h4>Generate Data</h4>
        <form onSubmit={handleSubmit}>
          <label>
            Rows:
            <input type="number" value={rows} onChange={(e) => setRows(Number(e.target.value))} />
          </label>
          <label>
            Columns:
            <input type="number" value={cols} onChange={(e) => setCols(Number(e.target.value))} />
          </label>
          <label>
            Number of Transmitters:
            <input type="number" value={numTransmitters} onChange={(e) => setNumTransmitters(Number(e.target.value))} />
          </label>
          <label>
            Transmitter Mean:
            <input type="number" value={mean} onChange={(e) => setMean(Number(e.target.value))} />
          </label>
          <label>
            Transmitter Standard Deviation:
            <input type="number" value={sd} onChange={(e) => setSd(Number(e.target.value))} />
          </label>
          <label>
            Bandwidth:
            <input type="number" value={bandwidth} onChange={(e) => setBandwidth(Number(e.target.value))} />
          </label>
          <label>
            Active Time:
            <input type="number" value={activeTime} onChange={(e) => setActiveTime(Number(e.target.value))} />
          </label>
          <label>
            Matrix Filename:
            <input type="text" value={matrixFilename} onChange={(e) => setMatrixFilename(e.target.value)} />
          </label>
          <label>
            Transmitters Filename:
            <input type="text" value={transmittersFilename} onChange={(e) => setTransmittersFilename(e.target.value)} />
          </label>
          <button type="submit">Generate</button>
          <button type="button" onClick={onClose}>Cancel</button>
        </form>
      </div>
    </div>
  );
};

export default GeneratePopup;