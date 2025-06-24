import { useState } from "react";
import axios from "axios";

function UploadFile() {
  const [file, setFile] = useState(null);
  const [fileUrl, setFileUrl] = useState("");

  const handleUpload = async () => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await axios.post("http://localhost:5000/api/files/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    setFileUrl(response.data.fileUrl);
  };

  return (
    <div>
      <input type="file" onChange={(e) => setFile(e.target.files[0])} />
      <button onClick={handleUpload}>Upload</button>
      {fileUrl && (
        <div>
          <p>File uploaded:</p>
          <a href={fileUrl} target="_blank" rel="noopener noreferrer">{fileUrl}</a>
        </div>
      )}
    </div>
  );
}

export default UploadFile;
