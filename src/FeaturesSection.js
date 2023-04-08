import React from "react";
import { Grid, Typography } from "@mui/material";
import { FeaturePaper, Section } from "./styles";
import VideocamIcon from "@mui/icons-material/Videocam";
import MicIcon from "@mui/icons-material/Mic";
import GroupWorkIcon from "@mui/icons-material/GroupWork";
import ExtensionIcon from "@mui/icons-material/Extension";

const features = [
  {
    title: "AI Transcription",
    description: "Automatic transcription using AI technology.",
    icon: <VideocamIcon fontSize="large" />
  },
  {
    title: "Voice Cloning",
    description: "Clone your voice for text-to-speech conversion.",
    icon: <MicIcon fontSize="large" />
  },
  {
    title: "Real-time Collaboration",
    description: "Collaborate with your team in real-time.",
    icon: <GroupWorkIcon fontSize="large" />
  },
  {
    title: "Seamless Integration",
    description: "Easily integrate with other tools and platforms.",
    icon: <ExtensionIcon fontSize="large" />
  }
];

const FeaturesSection = () => {
  return (
    <div className="features-section">
      <Section>
        <Typography variant="h4" gutterBottom>
          Features
        </Typography>
        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <FeaturePaper>
                {feature.icon}
                <Typography variant="h6">{feature.title}</Typography>
                <Typography variant="body1">{feature.description}</Typography>
              </FeaturePaper>
            </Grid>
          ))}
        </Grid>
      </Section>
    </div>
  );
};

export default FeaturesSection;
