import React from "react";
import { Typography, Box } from "@mui/material";

const Footer = () => {
  return (
    <Box
      sx={{
        backgroundColor: "primary.main",
        padding: "1rem",
        marginTop: "auto"
      }}
    >
      <Typography variant="body1" align="center" color="white">
        &copy; {new Date().getFullYear()} AI Video Editing Tool. All rights
        reserved.
      </Typography>
    </Box>
  );
};

export default Footer;
