import React, { useState } from "react";
import { Box, FormGroup, FormControlLabel, Switch } from "@mui/material";

const VideoPreview = ({ youtubeUrl }) => {
  const [removeFillers, setRemoveFillers] = useState(false);
  const [redactPii, setRedactPii] = useState(false);
  const [removeSilences, setRemoveSilences] = useState(false);
  const [generateSummary, setGenerateSummary] = useState(false);
  const [removeBg, setremoveBg] = useState(false);

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
        padding: "16px",
        marginRight: "16px"
      }}
    >
      <FormGroup
        row
        sx={{ color: "black", justifyContent: "center", marginBottom: "16px" }}
      >
        <FormControlLabel
          control={
            <Switch
              checked={removeFillers}
              onChange={(event) => setRemoveFillers(event.target.checked)}
              name="removeFillers"
              color="primary"
            />
          }
          label="Remove Fillers"
        />
        <FormControlLabel
          control={
            <Switch
              checked={redactPii}
              onChange={(event) => setRedactPii(event.target.checked)}
              name="redactPii"
              color="primary"
            />
          }
          label="Redact PII"
        />
        <FormControlLabel
          control={
            <Switch
              checked={removeSilences}
              onChange={(event) => setRemoveSilences(event.target.checked)}
              name="removeSilences"
              color="primary"
            />
          }
          label="Remove Silences"
        />
        <FormControlLabel
          control={
            <Switch
              checked={generateSummary}
              onChange={(event) => setGenerateSummary(event.target.checked)}
              name="generateSummary"
              color="primary"
            />
          }
          label="Generate Summary"
        />
        <FormControlLabel
          control={
            <Switch
              checked={removeBg}
              onChange={(event) => setremoveBg(event.target.checked)}
              name="RemoveBg"
              color="primary"
            />
          }
          label="Remove Bg"
        />
      </FormGroup>
      <iframe
        title="youtube-video-preview"
        width="100%"
        height="100%"
        src={`https://www.youtube.com/embed/${youtubeUrl.split("v=")[1]}`}
        allowFullScreen
        style={{ borderRadius: "4px" }}
      />
    </Box>
  );
};
export default VideoPreview;
