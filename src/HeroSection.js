import React from "react";
import { Typography, Button, Slide, Box } from "@mui/material";
import { Section } from "./styles";
import { useNavigate } from "react-router-dom";

const HeroSection = () => {
  const navigate = useNavigate();

  const handleGetStartedClick = () => {
    navigate("/editor");
  };

  return (
    <Section>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "90vh",
          textAlign: "center",
          background: "linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)",
          color: "white"
        }}
      >
        <Slide direction="right" in={true} mountOnEnter unmountOnExit>
          <Typography variant="h2" gutterBottom sx={{ fontWeight: "bold" }}>
            AI-Powered Video Editing
          </Typography>
        </Slide>
        <Slide direction="left" in={true} mountOnEnter unmountOnExit>
          <Typography variant="h5" gutterBottom>
            Transform your video production process with our innovative,
            collaborative transcription-based video editing tool.
          </Typography>
        </Slide>
        <Slide direction="up" in={true} mountOnEnter unmountOnExit>
          <Button
            variant="contained"
            color="secondary"
            size="large"
            sx={{ fontWeight: "bold" }}
            onClick={handleGetStartedClick}
          >
            Get Started
          </Button>
        </Slide>
      </Box>
    </Section>
  );
};

export default HeroSection;
