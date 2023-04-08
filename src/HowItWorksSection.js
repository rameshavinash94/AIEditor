import React from "react";
import { Typography, Grid } from "@mui/material";
import { Section } from "./styles";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import EditIcon from "@mui/icons-material/Edit";
import RecordVoiceOverIcon from "@mui/icons-material/RecordVoiceOver";
import GroupWorkIcon from "@mui/icons-material/GroupWork";
import PublishIcon from "@mui/icons-material/Publish";

const howItWorksSteps = [
  {
    title: "Upload Files",
    description: "Upload your video and audio files.",
    icon: <CloudUploadIcon fontSize="large" />
  },
  {
    title: "Edit Transcription",
    description: "Edit the transcription text with ease.",
    icon: <EditIcon fontSize="large" />
  },
  {
    title: "Voice Cloning",
    description: "Use voice cloning for text-to-speech conversion.",
    icon: <RecordVoiceOverIcon fontSize="large" />
  },
  {
    title: "Collaboration",
    description: "Collaborate with your team in real-time.",
    icon: <GroupWorkIcon fontSize="large" />
  },
  {
    title: "Export & Share",
    description: "Export and share your final video.",
    icon: <PublishIcon fontSize="large" />
  }
];

const HowItWorksSection = () => {
  return (
    <Section>
      <Typography variant="h4" gutterBottom>
        How It Works
      </Typography>
      <Grid container spacing={4}>
        {howItWorksSteps.map((step, index) => (
          <Grid item xs={12} sm={6} md={4} lg={2} key={index}>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center"
              }}
            >
              {step.icon}
              <Typography variant="h6">{step.title}</Typography>
              <Typography variant="body1">{step.description}</Typography>
            </div>
          </Grid>
        ))}
      </Grid>
    </Section>
  );
};

export default HowItWorksSection;
