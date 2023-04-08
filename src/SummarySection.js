import React from "react";
import { Typography, Box } from "@mui/material";
import { Section } from "./styles";

const SummarySection = () => {
  return (
    <Section>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          padding: "2rem 1rem",
          background: "linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)",
          color: "white"
        }}
      >
        <Typography variant="h4" gutterBottom>
          Revolutionize Your Video Editing Workflow
        </Typography>
        <Typography variant="h6">
          Our AI-powered, collaborative transcription-based video editing tool
          simplifies your video production process, saving time and resources.
          Edit like a pro and take your projects to the next level.
        </Typography>
      </Box>
    </Section>
  );
};

export default SummarySection;
