"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import Papa from "papaparse";

export default function Home() {
  const [uploadedFileName, setUploadedFileName] = useState(null);
  const [previewData, setPreviewData] = useState([]);
  const [columns, setColumns] = useState({});
  const [manualMode, setManualMode] = useState(false);
  const [confirmedManual, setConfirmedManual] = useState(false);

  const detectColumnType = (header, values) => {
    const joined = values.join(" ").toLowerCase();

    if (/[\w.-]+@[\w.-]+\.\w+/.test(joined)) return "Email";
    if (/https?:\/\/(www\.)?linkedin\.com\/in\//.test(joined)) return "LinkedIn";
    if (/https?:\/\/(www\.)?instagram\.com\/[A-Za-z0-9_.]+/.test(joined)) return "Instagram";
    if (/https?:\/\/(www\.)?facebook\.com\/[A-Za-z0-9_.]+/.test(joined)) return "Facebook";
    if (/https?:\/\/|www\.[\w.-]+\.\w{2,}/.test(joined)) return "Website";
    if (/name|company|prospect/.test(header.toLowerCase())) return "Name";
    return "Unknown";
  };

  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setUploadedFileName(file.name);
    setManualMode(false);
    setConfirmedManual(false);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data.slice(0, 5);
        const headers = Object.keys(rows[0]);

        const detected = {};
        headers.forEach((header) => {
          const values = rows.map((row) => row[header] || "");
          detected[header] = detectColumnType(header, values);
        });

        setColumns(detected);
        setPreviewData(rows);
      },
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  const handleCheckboxChange = (header, type) => {
    setColumns((prev) => ({
      ...prev,
      [header]: prev[header] === type ? "Unknown" : type,
    }));
  };

  const handleAcceptColumns = () => {
    alert("✅ Column detection accepted.");
  };

  const handleManualInput = () => {
    setManualMode(true);
  };

  const handleConfirmManual = () => {
    setConfirmedManual(true);
    alert("✅ Manual column selection confirmed.");
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 items-center w-full">
        <h1 className="gabarito-semibold tracking-tighter text-6xl text-center max-w-[900px]">
          Upload the contact spreadsheet
        </h1>

        <div
          {...getRootProps()}
          className="w-[500px] h-20 border-2 border-dashed border-gray-400 rounded-xl flex items-center justify-center text-gray-600 cursor-pointer hover:border-blue-500 transition text-center"
        >
          <input {...getInputProps()} />
          {isDragActive ? (
            <p>Drop the file here...</p>
          ) : (
            <p>Drag and drop a CSV file here, or click to select</p>
          )}
        </div>

        {uploadedFileName && (
          <p className="text-green-600 font-medium">
            ✅ File uploaded: <span className="gabarito-semibold text-lg">{uploadedFileName}</span>
          </p>
        )}

        {previewData.length > 0 && (
          <div className="relative w-full max-w-5xl overflow-hidden rounded-xl border border-gray-300 shadow-md mt-8">
            <table className="w-full table-auto border-collapse">
              <thead className="bg-gray-100 text-left">
                <tr>
                  {Object.keys(previewData[0]).map((key, i) => (
                    <th key={i} className="p-3 border-b text-sm font-semibold">{key}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {previewData.map((row, i) => (
                  <tr key={i} className="even:bg-gray-50">
                    {Object.values(row).map((value, j) => (
                      <td key={j} className="p-3 border-b text-sm truncate max-w-[200px]">{value}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="absolute bottom-0 left-0 w-full h-20 bg-gradient-to-t from-white to-transparent pointer-events-none" />
          </div>
        )}

        {previewData.length > 0 && !manualMode && (
          <div className="mt-6 flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleAcceptColumns}
              className="bg-green-600 text-white px-6 py-3 rounded-xl hover:bg-green-700 transition"
            >
              ✅ Column detection is accurate
            </button>
            <button
              onClick={handleManualInput}
              className="bg-gray-200 text-gray-800 px-6 py-3 rounded-xl hover:bg-gray-300 transition"
            >
              🛠️ Manually define columns
            </button>
          </div>
        )}

        {manualMode && (
          <div className="mt-8 max-w-4xl w-full">
            <h2 className="text-xl font-semibold mb-4">🛠️ Select column types manually</h2>
            {Object.keys(columns).map((header, i) => (
              <div key={i} className="mb-3 p-4 bg-gray-50 border rounded-md flex flex-col gap-2">
                <p className="font-medium">{header}</p>
                <div className="flex gap-4 flex-wrap">
                  {["Email", "LinkedIn", "Instagram", "Facebook", "Website", "Name"].map((type) => (
                    <label key={type} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={columns[header] === type}
                        onChange={() => handleCheckboxChange(header, type)}
                      />
                      {type}
                    </label>
                  ))}
                </div>
              </div>
            ))}

            <div className="mt-6 flex justify-center">
              <button
                onClick={handleConfirmManual}
                className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition"
              >
                ✅ Confirm column selection
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
