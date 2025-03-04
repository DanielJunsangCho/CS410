"""
CS-410: Generates spectrograms from uploaded files and stores them in MongoDB
@file app.py
@authors Jun Cho, Will Cho, Grace Johnson, Connor Whynott
@collaborators None
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import matplotlib.pyplot as plt
import io
import base64
from pymongo import MongoClient
from bson import ObjectId
from gridfs import GridFS
from SigMF import SigMF
from FileData import FileData
import csv
import os
import json

import matplotlib
# Use the Agg backend for Matplotlib to avoid using any X server
matplotlib.use('Agg')

"""
 * Creates and configures the Flask application.
 * @return The configured Flask application.
"""
def create_app():
    # Initialize the Flask application
    app = Flask(__name__)
    CORS(app)  # Enable CORS for all routes

    # MongoDB setup using GridFS
    client = MongoClient("mongodb://localhost:27017")
    db = client['files_db']
    fs = GridFS(db)

    @app.route('/upload', methods=['POST'])
    def upload_file():
        """
        Uploads both .cfile and .sigmf-meta files, converts the cfile to CSV, 
        generates a spectrogram, and stores everything in MongoDB.
        """
        if 'cfile' not in request.files or 'metaFile' not in request.files:
            return jsonify({'error': 'Both .cfile and .sigmf-meta files are required'}), 400

        cfile = request.files['cfile']
        metafile = request.files['metaFile']
        original_name = cfile.filename.replace('.cfile', '')  # Remove extension

        # Parse metadata using SigMF class
        sigmf_metadata = SigMF(metafile)

        # Read .cfile and convert to complex numpy array
        cfile.seek(0)
        iq_data = np.frombuffer(cfile.read(), dtype=np.complex64)

        # Convert IQ data into CSV format
        csv_data = io.StringIO()
        csv_writer = csv.writer(csv_data)
        csv_writer.writerow(["Real", "Imaginary"])
        for sample in iq_data:
            csv_writer.writerow([sample.real, sample.imag])

        csv_data.seek(0)
        print("Generated CSV")

        # Store CSV in GridFS
        csv_file_id = fs.put(csv_data.getvalue().encode(), filename=f"{original_name}.csv")

        # Generate spectrogram
        plt.figure()
        Pxx, freqs, bins, im = plt.specgram(iq_data, Fs=sigmf_metadata.sample_rate, Fc=sigmf_metadata.center_frequency, cmap='viridis')
        plt.close()

        # Convert spectrogram to PNG (Binary)
        buf = io.BytesIO()
        plt.imshow(10 * np.log10(Pxx.T), aspect='auto', extent=[freqs[0], freqs[-1], bins[-1], 0], cmap='viridis')
        plt.xlabel("Frequency [Hz]")
        plt.ylabel("Time [s]")
        plt.savefig(buf, format='png')
        plt.close()
        buf.seek(0)
        spectrogram_data = buf.getvalue()

        # Store spectrogram in GridFS
        spectrogram_file_id = fs.put(spectrogram_data, filename=f"{original_name}_spectrogram.png")

        # Create FileData object
        file_data = FileData(raw_data_filename=cfile.filename, fft=1024, sigmf=sigmf_metadata)

        # Convert `SigMF` and `FileData` to JSON-serializable format
        file_data_dict = {
            "raw_data_filename": file_data.raw_data_filename,
            "csv_filename": file_data.csv_filename,
            "spectrogram_filename": file_data.spectrogram_filename,
            "iq_plot_filename": file_data.iq_plot_filename,
            "time_domain_filename": file_data.time_domain_filename,
            "freq_domain_filename": file_data.freq_domain_filename,
            "sigmf": sigmf_metadata.__dict__,  # Convert `SigMF` to a dictionary
            "fft": file_data.fft
        }

        # Store everything in a single MongoDB document
        document = {
            "filename": original_name,
            "csv_file_id": str(csv_file_id),  # Convert ObjectId to string
            "spectrogram_file_id": str(spectrogram_file_id),  # Convert ObjectId to string
            "metadata": sigmf_metadata.__dict__,  # Convert metadata to dictionary
            "filedata": file_data_dict  # Store FileData as a dictionary
        }

        file_record_id = db.file_records.insert_one(document).inserted_id

        print(f"Saved '{original_name}' with CSV, Spectrogram, Metadata, and FileData.")

        # Return spectrogram to frontend
        encoded_img = base64.b64encode(spectrogram_data).decode('utf-8')
        return jsonify({'spectrogram': encoded_img, 'message': 'All files saved successfully', 'file_id': str(file_record_id)})


    @app.route('/save', methods=['POST'])
    def save_file():
        """
        Saves all related files (CSV, spectrogram, metadata, and FileData) in MongoDB under the original cfile name.
        """
        if 'filename' not in request.json:
            return jsonify({'error': 'Filename is required'}), 400

        filename = request.json['filename']

        try:
            # Check if the file already exists in the database
            existing_file = db.file_records.find_one({"filename": filename})

            if existing_file:
                return jsonify({'message': 'File already saved', 'file_id': str(existing_file["_id"])})

            # Retrieve CSV and Spectrogram IDs from GridFS
            csv_file = fs.find_one({"filename": f"{filename}.csv"})
            spectrogram_file = fs.find_one({"filename": f"{filename}_spectrogram.png"})

            if not csv_file or not spectrogram_file:
                return jsonify({'error': 'Associated CSV or Spectrogram not found'}), 404

            # Retrieve metadata and FileData from uploaded data
            file_entry = db.file_records.find_one({"filename": filename}, {"metadata": 1, "filedata": 1})

            if not file_entry:
                return jsonify({'error': 'Metadata and FileData not found'}), 404

            # Ensure correct ObjectId storage
            document = {
                "filename": filename,
                "csv_file_id": str(csv_file._id),  # Ensure it's stored as a string
                "spectrogram_file_id": str(spectrogram_file._id),  # Ensure it's stored as a string
                "metadata": file_entry["metadata"],
                "filedata": file_entry["filedata"]
            }

            file_record_id = db.file_records.insert_one(document).inserted_id
            print(f"File '{filename}' saved with ID {file_record_id}")

            return jsonify({'message': 'All related files saved successfully', 'file_id': str(file_record_id)})

        except Exception as e:
            print("Error saving files:", e)
            return jsonify({'error': str(e)}), 500

    @app.route('/files', methods=['GET'])
    def get_files():
        """
        Lists all stored filenames.
        """
        try:
            files = db.file_records.find({}, {"filename": 1})  # Ensure fetching filenames
            file_list = [{"_id": str(file["_id"]), "filename": file["filename"]} for file in files]
            return jsonify({"files": file_list})  # ✅ Correct JSON format

        except Exception as e:
            return jsonify({'error': str(e)}), 500

    @app.route('/file/<file_id>/spectrogram', methods=['GET'])
    def get_file_spectrogram(file_id):
        """
        Retrieves a spectrogram PNG from GridFS using the saved file ID.
        """
        try:
            if not ObjectId.is_valid(file_id):
                return jsonify({'error': 'Invalid file ID format'}), 400  # Prevent invalid ObjectId error

            file_record = db.file_records.find_one({"_id": ObjectId(file_id)})
            if not file_record:
                return jsonify({'error': 'File not found'}), 404

            # Fetch spectrogram PNG from GridFS
            spectrogram_file = fs.get(ObjectId(file_record['spectrogram_file_id']))
            spectrogram_data = spectrogram_file.read()

            # Convert to base64
            encoded_img = base64.b64encode(spectrogram_data).decode('utf-8')
            return jsonify({'spectrogram': encoded_img})

        except Exception as e:
            return jsonify({'error': str(e)}), 500



    @app.route('/refresh', methods=['POST'])
    def refresh_files():
        """
        Clears all saved files.
        """
        try:
            # Delete all records from the collection
            db.file_records.delete_many({})
            # Delete all files from GridFS
            for file in fs.find():
                fs.delete(file._id)

            print("All files cleared from the database.")
            return jsonify({'message': 'All files have been cleared.'})

        except Exception as e:
            print("Error clearing files:", e)
            return jsonify({'error': str(e)}), 500
        
    return app


if __name__ == '__main__':
    app = create_app()
    app.run(debug=True)