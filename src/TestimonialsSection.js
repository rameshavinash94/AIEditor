import React from "react";
import { Typography, Slide } from "@mui/material";
import { Section } from "./styles";

const TestimonialsSection = () => {
  return (
    <Section>
      <Slide direction="up" in={true} mountOnEnter unmountOnExit>
        <Typography variant="h4">Testimonials</Typography>
      </Slide>
      <Slide direction="up" in={true} mountOnEnter unmountOnExit>
        <Typography variant="body1">
          "This AI video editor has completely changed the way we work. It's so
          easy to use and has saved us countless hours of editing."
        </Typography>
      </Slide>
    </Section>
  );
};

export default TestimonialsSection;
