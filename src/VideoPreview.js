import React, { useState,useRef,useEffect } from "react";
import { Box, FormGroup, FormControlLabel, Switch } from "@mui/material";
import ReactPlayer from "react-player";

const VideoPreview = ({ transcript,url, playing, onProgress, onPlay, onPause, seekTo }) => {
  const playerRef = useRef(null);
  const [prevSeekTo, setPrevSeekTo] = useState(null);

  useEffect(() => {
    console.log("SeekTo value:", seekTo);
    console.log("PrevSeekTo value:", prevSeekTo);
    console.log("PlayerRef value:", playerRef);
    if (seekTo !== null && seekTo !== prevSeekTo && playerRef.current) {
      playerRef.current.seekTo(seekTo);
      setPrevSeekTo((prev) => {
        if (seekTo !== prev) {
          return seekTo;
        }
        return prev;
      });
    }
  }, [seekTo, prevSeekTo]);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        minHeight: "60vh",
        // width: "50%",
        backgroundColor: "rgba(255, 255, 255, 0.8)",
        borderRadius: "4px",
        padding: "16px",
        marginRight: "16px"
      }}
    >
     
      <ReactPlayer
      ref={playerRef}
      url={url}
      playing={playing}
      onProgress={onProgress}
      onPlay={onPlay}
      onPause={onPause}
      controls={true}
      width="100%"
      height="80%"
    />
    </Box>
  );
};
export default VideoPreview;
