import React, { useState } from 'react';

interface GeneratePopupProps {
  onClose: () => void;
  onGenerate: (data: {
    rows: number;
    cols: number;
    numTransmitters: number;
    transmitterMean: number;
    transmitterSd: number;
    noiseMean: number;
    noiseSd: number;
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
  const [transmitterMean, setTransmitterMean] = useState<number>(-75);
  const [transmitterSd, setTransmitterSd] = useState<number>(2);
  const [noiseMean, setNoiseMean] = useState<number>(-109);
  const [noiseSd, setNoiseSd] = useState<number>(10);
  const [bandwidth, setBandwidth] = useState<number>(200);
  const [activeTime, setActiveTime] = useState<number>(10);
  const [matrixFilename, setMatrixFilename] = useState<string>('output_matrix.csv');
  const [transmittersFilename, setTransmittersFilename] = useState<string>('output_transmitters.csv');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = {
      rows,
      cols,
      numTransmitters,
      transmitterMean,
      transmitterSd,
      noiseMean,
      noiseSd,
      bandwidth,
      activeTime,
      matrixFilename,
      transmittersFilename,
    };
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
            <input type="number" value={transmitterMean} onChange={(e) => setTransmitterMean(Number(e.target.value))} />
          </label>
          <label>
            Transmitter Standard Deviation:
            <input type="number" value={transmitterSd} onChange={(e) => setTransmitterSd(Number(e.target.value))} />
          </label>
          <label>
            Noise Mean:
            <input type="number" value={noiseMean} onChange={(e) => setNoiseMean(Number(e.target.value))} />
          </label>
          <label>
            Noise Standard Deviation:
            <input type="number" value={noiseSd} onChange={(e) => setNoiseSd(Number(e.target.value))} />
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