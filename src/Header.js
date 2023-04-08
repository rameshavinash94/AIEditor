import React from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton
} from "@mui/material";
import logo from "./AIEditorlogo.png"; // Import the logo image

const Header = () => {
  return (
    <AppBar
      position="static"
      elevation={0}
      sx={{
        backgroundImage: "linear-gradient(90deg, #FF4B2B 0%, #FF416C 100%)"
      }}
    >
      <Toolbar>
        <IconButton
          edge="start"
          color="inherit"
          aria-label="logo"
          sx={{ mr: 2 }}
        >
          <img src={logo} alt="EditScape Logo" height="40" />
        </IconButton>
        <Typography
          variant="h6"
          component="div"
          sx={{ flexGrow: 1 }}
        ></Typography>
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <Button color="inherit" sx={{ marginRight: 1 }}>
            Login
          </Button>
          <Button
            variant="contained"
            sx={{ backgroundColor: "#FF4B2B", color: "#fff" }}
          >
            Sign Up
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
