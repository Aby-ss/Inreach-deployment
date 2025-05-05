"use client"

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";

export default function Home() {
  const [uploadedFileName, setUploadedFileName] = useState(null);

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      setUploadedFileName(acceptedFiles[0].name);
      console.log("Dropped file:", acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 items-center">
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
            <p>Drag and drop a CSV/XLSX file here, or click to select</p>
          )}
        </div>

        {uploadedFileName && (
          <p className="text-green-600 font-medium">
            ✅ File uploaded: <span className="gabarito-semibold text-lg">{uploadedFileName}</span>
          </p>
        )}
      </main>
    </div>
  );
}
