import React from "react";
import { Box } from "@mui/material";
import Quill from "quill";
import "quill/dist/quill.snow.css";

const toolbarOptions = [
  ["bold", "italic", "underline", "strike"],
  ["blockquote", "code-block"],

  [{ header: 1 }, { header: 2 }],
  [{ list: "ordered" }, { list: "bullet" }],
  [{ script: "sub" }, { script: "super" }],
  [{ indent: "-1" }, { indent: "+1" }],

  [{ direction: "rtl" }],

  [{ size: ["small", false, "large", "huge"] }],
  [{ header: [1, 2, 3, 4, 5, 6, false] }],

  [{ color: [] }, { background: [] }],
  [{ font: [] }],
  [{ align: [] }],

  ["clean"]
];

class TranscriptionEditor extends React.Component {
  componentDidMount() {
    this.quill = new Quill("#transcription-editor", {
      theme: "snow",

      modules: {
        toolbar: toolbarOptions
      }
    });
    this.quill.root.style.color = "black";
  }

  render() {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          minHeight: "60vh",
          width: "50%",
          backgroundColor: "rgba(255, 255, 255, 0.8)",
          borderRadius: "4px",
          padding: "16px"
        }}
      >
        <div
          id="transcription-editor"
          style={{
            width: "100%",
            height: "100%",
            backgroundColor: "white",
            borderRadius: "4px"
          }}
        />
      </Box>
    );
  }
}

export default TranscriptionEditor;
