/** 
 * CS-410: Frontend for uploading files, generating spectrograms, and interacting with MongoDB
 * @file app.tsx
 * @authors Jun Cho, Will Cho, Grace Johnson, Connor Whynott
 * @collaborators None
 */

import { useState, useEffect, ChangeEvent } from 'react';
import './App.css';
import DisplayTabs from './components/Tabs';
import './EnhancedApp.css';

// Interface for saved files
interface SavedFile {
  _id: string;
  filename: string;
}

function App() {
  // State variables
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [spectrogram, setSpectrogram] = useState<string | null>(null);
  const [savedFiles, setSavedFiles] = useState<SavedFile[]>([]);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);

  // Handle file selection
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setSelectedFile(file);
    setSelectedFileName(file ? file.name : 'No file selected');
  };

  // Handle file upload
  const handleUpload = async () => {
    if (!selectedFile) return setStatusMessage('No file selected');
    setStatusMessage('Uploading file...');
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      const response = await fetch('http://127.0.0.1:5000/upload', { method: 'POST', body: formData });
      const result = await response.json();
      if (result.error) return setStatusMessage(`Error: ${result.error}`);
      setSpectrogram(result.spectrogram);
      setStatusMessage('File uploaded successfully!');
    } catch (error) {
      setStatusMessage('Upload failed. Please try again.');
    }
  };

  // Handle file save to database
  const handleSave = async () => {
    if (!selectedFile) return setStatusMessage('No file selected');
    setStatusMessage('Saving file...');
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      await fetch('http://127.0.0.1:5000/save', { method: 'POST', body: formData });
      fetchSavedFiles();
      setStatusMessage('File saved to database successfully.');
    } catch (error) {
      setStatusMessage('Failed to save file.');
    }
  };

  // Handle clearing all saved files
  const handleClearFiles = async () => {
    setStatusMessage('Clearing all saved files...');
    try {
      await fetch('http://127.0.0.1:5000/refresh', { method: 'POST' });
      fetchSavedFiles();
      setStatusMessage('All saved files cleared.');
    } catch (error) {
      setStatusMessage('Failed to clear saved files.');
    }
  };

  // Handle loading a saved file
  const handleLoadFile = async (fileId: string) => {
    setStatusMessage('Loading file...');
    try {
      const response = await fetch(`http://127.0.0.1:5000/file/${fileId}/spectrogram`);
      const result = await response.json();
      if (result.error) return setStatusMessage(`Error: ${result.error}`);
      setSpectrogram(result.spectrogram);
      setStatusMessage('File loaded successfully.');
    } catch (error) {
      setStatusMessage('Failed to load file.');
    }
  };

  // Fetch saved files from the database
  const fetchSavedFiles = async () => {
    try {
      const response = await fetch('http://127.0.0.1:5000/files');
      const result = await response.json();
      setSavedFiles(result.files);
    } catch (error) {
      setStatusMessage('Failed to fetch saved files.');
    }
  };

  // Fetch saved files on component mount
  useEffect(() => {
    fetchSavedFiles();
  }, []);

  return (
    <>
      <header className="app-header"><h1>GC<sup>3</sup></h1></header>
      <DisplayTabs />
      {/* <FileHandle /> */}
    </>
  )
}



export default App;