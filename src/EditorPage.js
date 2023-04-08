import React, { useState } from "react";
import {
  Box,
  TextField,
  IconButton,
  Typography,
  Button,
  Menu,
  MenuItem
} from "@mui/material";
import VideoPreview from "./VideoPreview";
import TranscriptionEditor from "./TranscriptionEditor";
import logo from "./AIEditorlogo.png"; // Import the logo image
import { Carousel } from "react-responsive-carousel";
import "react-responsive-carousel/lib/styles/carousel.min.css";

const EditorPage = () => {
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [anchorEl, setAnchorEl] = useState(null);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };
  const themes = [
    {
      name: "Theme 1",
      imageUrl: "https://via.placeholder.com/200x100?text=Theme+1"
    },
    {
      name: "Theme 2",
      imageUrl: "https://via.placeholder.com/200x100?text=Theme+2"
    },
    {
      name: "Theme 3",
      imageUrl: "https://via.placeholder.com/200x100?text=Theme+3"
    },
    {
      name: "Theme 4",
      imageUrl: "https://via.placeholder.com/200x100?text=Theme+4"
    },
    {
      name: "Theme 5",
      imageUrl: "https://via.placeholder.com/200x100?text=Theme+5"
    }
  ];

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        minHeight: "100vh",
        background: "linear-gradient(55deg, #E2E5DE 40%, #FF8E53 60%)",
        color: "white",
        padding: "16px"
      }}
    >
      <IconButton edge="start" color="inherit" aria-label="logo" sx={{ mr: 2 }}>
        <img src={logo} alt="EditScape Logo" height="40" />
      </IconButton>
      <TextField
        label="YouTube URL"
        value={youtubeUrl}
        onChange={(e) => setYoutubeUrl(e.target.value)}
        variant="outlined"
        size="small"
        sx={{
          width: "50%",
          marginBottom: "16px",
          backgroundColor: "white",
          borderRadius: "25px"
        }}
        InputProps={{
          style: {
            borderRadius: "25px"
          }
        }}
      />
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          width: "100%",
          height: "100%"
        }}
      >
        <VideoPreview youtubeUrl={youtubeUrl} />
        <TranscriptionEditor />
      </Box>
      <Box
        sx={{
          padding: "1.5%",
          alignSelf: "flex-end",
          display: "flex",
          flexDirection: "row"
        }}
      >
        <Button
          aria-controls="share-export-menu"
          aria-haspopup="true"
          onClick={handleClick}
          variant="contained"
          color="primary"
          size="small"
          sx={{ marginBottom: "16px" }}
        >
          Share & Export
        </Button>
        <Menu
          id="share-export-menu"
          anchorEl={anchorEl}
          keepMounted
          open={Boolean(anchorEl)}
          onClose={handleClose}
        >
          <MenuItem onClick={handleClose}>Share</MenuItem>
          <MenuItem onClick={handleClose}>Export</MenuItem>
        </Menu>
      </Box>
      <Box
        sx={{
          padding: "1%",
          display: "flex",
          flexDirection: "row",
          width: "100%",
          height: "100%"
        }}
      >
        <Carousel
          showThumbs={true}
          showStatus={true}
          showIndicators={true}
          width="35%"
          centerMode
          centerSlidePercentage={33}
          slidesToShow={3}
        >
          {themes.map((theme, index) => (
            <div key={index}>
              <img src={theme.imageUrl} alt={theme.name} />
              <p className="legend">{theme.name}</p>
            </div>
          ))}
        </Carousel>
      </Box>
    </Box>
  );
};

export default EditorPage;
