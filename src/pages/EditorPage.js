import React, { useState, useEffect } from "react";
import {
  Box,
  TextField,
  IconButton,
  Typography,
  Button,
  Menu,
  MenuItem,
  FormGroup, FormControlLabel, Switch,
  FormControl, InputLabel, Select,
  Dialog, DialogTitle, DialogContent, DialogActions, Slider,
} from "@mui/material";
import VideoPreview from "../VideoPreview";
import CircularProgress from '@mui/material/CircularProgress';
import Backdrop from '@mui/material/Backdrop';

import logo from "../AIEditorlogo.png"; // Import the logo image
// import { Carousel } from "react-responsive-carousel";
import "react-responsive-carousel/lib/styles/carousel.min.css";
import TranscriptionQuill from "./TranscriptionEditor";
import { change_resolution, download_yt_video, extract_audio, get_transcript, copy_video, remove_silences, remove_filler_words, trim_operations, identify_PII, Silence_interval, muting_audio, merge_silenced_audio } from "../Utils";
import Swal from 'sweetalert2'
import { ToastContainer, toast } from 'react-toastify';

const tinyUrl = "https://us-west2-aieditor-383809.cloudfunctions.net/url_shortener";

const EditorPage = () => {
  const [transcriptions, setTranscriptions] = useState([]);
  const [entiretranscription, setEntireTranscription] = useState([]);

  const [videoUrl, setVideoUrl] = useState("");

  const [input_gs_path, setInput_gs_path] = useState("");

  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = React.useState('');

  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0
  });
  const [clickedWord, setClickedWord] = useState(null);

  const [removeFillers, setRemoveFillers] = useState(false);
  const [trimoperations, setTrimoperations] = useState(false);
  const [redactPii, setRedactPii] = useState(false);
  const [removeSilences, setRemoveSilences] = useState(false);
  const [changeResolution, setChangeResolution] = useState(false);
  const [removeBg, setremoveBg] = useState(false);
  const [showTrimPopup, setShowTrimPopup] = useState(false);
  const [startSeconds, setStartSeconds] = useState(0);
  const [endSeconds, setEndSeconds] = useState(0);
  const [showSilencePopup, setShowSilencePopup] = useState(false);
  const [showResolutionPopup, setShowResolutionPopup] = useState(false);
  const [frequencyInDB, setFrequencyInDB] = useState(-50);
  const [silenceIntervals, setSilenceIntervals] = useState(1000);
  const [selectedOption, setSelectedOption] = useState("");
  const handleTrimOkClick = () => {
    // Do something with startSeconds and endSeconds
    console.log("Start seconds:", startSeconds);
    // call the trim function
    Trim_Video(input_gs_path, startSeconds, endSeconds);
    setShowTrimPopup(false);
    setTrimoperations(false);
  };

  const handleSilenceOkClick = () => {
    // Do something with frequencyInDB and silenceIntervals
    console.log("Frequency in DB:", frequencyInDB);
    console.log("Silence intervals:", silenceIntervals);

    // call the remove silence function
    Remove_Silences(input_gs_path, frequencyInDB, silenceIntervals);

    setShowSilencePopup(false);
    setRemoveSilences(false);
  };

  const handleChangeResolutionOkClick = () => {
    console.log("Selected option:", selectedOption);
    // call the change resolution function
    Change_Resolution(input_gs_path, selectedOption);
    setShowResolutionPopup(false);
    setChangeResolution(false);
  };

  const handleSeekComplete = () => {
    setVideoState((prevState) => ({ ...prevState, seekTo: null }));
  };

  const togglePlayback = () => {
    setVideoState({ ...videoState, playing: !videoState.playing });
  };

  const [videoState, setVideoState] = useState({
    currentTime: 0,
    playing: false
  });

  const handleWordContextMenu = (e, word) => {
    e.preventDefault();
    setClickedWord(word);
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY
    });
  };

  const handleTranscriptionClick = (timestamp) => {
    togglePlayback();
    console.log("Clicked timestamp:", timestamp);
    setVideoState((prevState) => ({
      ...prevState,
      seekTo: timestamp,
      playing: true
    }));
  };

  const handleProgress = (progress) => {
    setVideoState({ ...videoState, currentTime: progress.playedSeconds });
  };

  const handleConcatenateVideo = (transcriptions, public_shared_url, entiretranscription, video_gs_url) => {
    setTranscriptions(transcriptions);
    setVideoUrl(public_shared_url);
    setEntireTranscription(entiretranscription);
    setInput_gs_path(video_gs_url);
    console.log("Concatenated video url:", public_shared_url);
    console.log("Concatenated video gs path:", video_gs_url);
  }

  const handleDeleteTranscriptions = (transcriptions, public_shared_url, entiretranscription, video_gs_url) => {
    // Update your video playback logic to remove the deleted transcriptions
    // For example, you might update the transcriptions state and the video player's playback data
    setTranscriptions(transcriptions);
    setVideoUrl(public_shared_url);
    setEntireTranscription(entiretranscription);
    setInput_gs_path(video_gs_url);
    // Update your video playback data here
  };

  const handleReplaceTranscription = (transcriptions, public_shared_url, entiretranscription, video_gs_url) => {
    setTranscriptions(transcriptions);
    setVideoUrl(public_shared_url);
    setEntireTranscription(entiretranscription);
    setInput_gs_path(video_gs_url);
  };

  useEffect(() => {
    if (videoState.seekTo !== null) {
      setTimeout(() => {
        setVideoState((prevState) => ({ ...prevState, seekTo: null }));
      }, 100);
    }
  }, [videoState.seekTo]);

  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [anchorEl, setAnchorEl] = useState(null);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  function DownloadVideo(url) {
    setProgress(2);
    const downloadVideo = async (url) => {
      // Reset progress
      setProgress(5);
      setProgressMessage('Downloading video from YouTube');

      const response = await download_yt_video(url, "test");
      setProgress(20);
      const public_shared_url = response[1]
      const video_gs_url = response[0]

      setProgressMessage('Copying video to Google Cloud Storage');
      const blob = await copy_video(video_gs_url);
      setProgress(40);

      setProgressMessage('Extracting audio from video');
      const audio_url = await extract_audio(video_gs_url);
      setProgress(60);

      setProgressMessage('Transcribing audio and extracting timestamps');
      const transcript = await get_transcript(audio_url[0]);
      setProgress(80);

      console.log("transcript:", transcript.transcript);
      setEntireTranscription(transcript.transcript);
      setVideoUrl(public_shared_url);
      setInput_gs_path(video_gs_url);
      // extract from json
      const word_timestamps = transcript.word_timestamps;
      const transcriptions = [];
      for (var i = 0; i < word_timestamps.length; i++) {
        var start = word_timestamps[i][1];
        var end = word_timestamps[i][2];
        var word = word_timestamps[i][0];
        var obj = {
          text: word,
          timestamp: start,
          end: end
        };
        transcriptions.push(obj);
      }
      setTranscriptions(transcriptions);

      setProgress(100);
      setProgressMessage('Done!');
    };

    downloadVideo(url);
  }

  function Remove_Silences(input_gs_path, frequencyInDB, silenceIntervals) {

    const removesilences = async (input_gs_path, frequencyInDB, silenceIntervals) => {
      if (input_gs_path === "") {
        alert("Please upload a video first!");
        return;
      }
      setProgress(5);
      setProgressMessage('Started Removing Silences from Video');
      // Reset progress
      setProgress(10);
      setProgressMessage('Finding and Removing Silences from Video');
      console.log("input_gs_path:", input_gs_path);

      const response = await remove_silences(input_gs_path, frequencyInDB, silenceIntervals);
      setProgress(20);
      const public_shared_url = response[1]
      const video_gs_url = response[0]

      setProgressMessage('Copying updated video to Google Cloud Storage');
      const blob = await copy_video(video_gs_url);
      setProgress(40);

      setProgressMessage('Extracting audio from video');
      const audio_url = await extract_audio(video_gs_url);
      setProgress(60);

      setProgressMessage('Transcribing new updated audio and extracting timestamps');
      const transcript = await get_transcript(audio_url[0]);
      setProgress(80);

      setEntireTranscription(transcript.transcript);

      console.log("transcript:", transcript.transcript);
      setVideoUrl(public_shared_url);
      setInput_gs_path(video_gs_url);
      // extract from json
      const word_timestamps = transcript.word_timestamps;
      const transcriptions = [];
      for (var i = 0; i < word_timestamps.length; i++) {
        var start = word_timestamps[i][1];
        var end = word_timestamps[i][2];
        var word = word_timestamps[i][0];
        var obj = {
          text: word,
          timestamp: start,
          end: end
        };
        transcriptions.push(obj);
      }
      setTranscriptions(transcriptions);
      setProgress(100);
      setProgressMessage('Done!');
    };
    removesilences(input_gs_path, frequencyInDB, silenceIntervals);
  }

  function Trim_Video(input_gs_path, start, end) {
    setProgress(1);
    setProgressMessage('Started Trimming Video');

    const trimvideo = async (input_gs_path, start, end) => {
      setProgress(5);
      setProgressMessage('Trimming Video');
      // call the TrimVideo function to trim the video
      const response = await trim_operations(input_gs_path, start, end);
      if (response[1] === videoUrl) {
        setProgress(100);
        setProgressMessage("No trimming required!");
        return;
      }
      const public_shared_url = response[1]
      const video_gs_url = response[0]

      setProgress(20);
      setProgressMessage('Copying updated video to Google Cloud Storage');
      const blob = await copy_video(video_gs_url);
      setProgress(40);
      setProgressMessage('Extracting audio from video');
      const audio_url = await extract_audio(video_gs_url);
      setProgress(60);
      setProgressMessage('Transcribing new updated audio and extracting timestamps');
      const transcript = await get_transcript(audio_url[0]);
      setProgress(80);
      setEntireTranscription(transcript.transcript);

      console.log("transcript:", transcript.transcript);
      setVideoUrl(public_shared_url);
      setInput_gs_path(video_gs_url);
      // save word timestamps
      const word_timestamps = transcript.word_timestamps;
      const transcriptions = [];
      for (var i = 0; i < word_timestamps.length; i++) {
        var start = word_timestamps[i][1];
        var end = word_timestamps[i][2];
        var word = word_timestamps[i][0];
        var obj = {
          text: word,
          timestamp: start,
          end: end
        };
        transcriptions.push(obj);
      }
      setTranscriptions(transcriptions);
      setProgress(100);
      setProgressMessage('Done!');
    }

    trimvideo(input_gs_path, start, end);
  }

  function Change_Resolution(input_gs_path, resolution) {
    const changeresolution = async (input_gs_path, resolution) => {
      setProgress(10);
      setProgressMessage('Started Changing Resolution of Video');
      // call the ChangeResolution function to change the resolution of the video
      const response = await change_resolution(input_gs_path, resolution);
      const public_shared_url = response[1]
      const video_gs_url = response[0]
      setProgress(40);
      setProgressMessage('Completed Changing Resolution of Video');

      setProgress(60);
      setProgressMessage('Copying updated video to Google Cloud Storage');
      const blob = await copy_video(video_gs_url);
      setProgress(100);
      setProgressMessage('Done!');
      setVideoUrl(public_shared_url);
      setInput_gs_path(video_gs_url);
    }
    changeresolution(input_gs_path, resolution);
  }

  function Remove_Fillers(input_gs_path, transcriptions) {
    let fillerwords = ['hmm', 'uhm', 'uh', 'um', 'ah', 'like']
    setProgress(1);
    setProgressMessage('Started Removing Filler Words from Video');
    const removefillers = async (input_gs_path, transcriptions, fillerWords) => {
      setProgress(5);
      setProgressMessage('Identifying Filler Words in Video and Removing them');
      // call the RemoveFillerWords function to remove fillers words 
      const response = await remove_filler_words(input_gs_path, transcriptions, fillerWords);
      if (response[1] === videoUrl) {
        setProgress(100);
        setProgressMessage("No filler words found in the video!");
        return;
      }
      const public_shared_url = response[1]
      const video_gs_url = response[0]

      setProgress(20);
      setProgressMessage('Copying updated video to Google Cloud Storage');
      const blob = await copy_video(video_gs_url);

      setProgress(40);
      setProgressMessage('Extracting audio from video');
      const audio_url = await extract_audio(video_gs_url);

      setProgress(60);
      setProgressMessage('Transcribing new updated audio and extracting timestamps');
      const transcript = await get_transcript(audio_url[0]);

      setVideoUrl(public_shared_url);
      setInput_gs_path(video_gs_url);
      // extract from json
      const word_timestamps = transcript.word_timestamps;
      const word_transcriptions = [];
      for (var i = 0; i < word_timestamps.length; i++) {
        var start = word_timestamps[i][1];
        var end = word_timestamps[i][2];
        var word = word_timestamps[i][0];
        var obj = {
          text: word,
          timestamp: start,
          end: end
        };
        word_transcriptions.push(obj);
      }
      setTranscriptions(word_transcriptions);
      setProgress(100);
      setProgressMessage('Done!');
      setEntireTranscription(transcript.transcript);
    }
    removefillers(input_gs_path, transcriptions, fillerwords);
  }

  async function generateTinyURL() {
    const response = await fetch(tinyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        "URL": videoUrl
      })
    });

    const json = await response.json();
    navigator.clipboard.writeText(json.shortened_url);
    toast.success("Url Copied to clipboard");
  }


  useEffect(() => {
    if (removeFillers) {
      // filler words to remove 
      Remove_Fillers(input_gs_path, transcriptions);
    }
  }, [removeFillers]);


  const handleConfirm = async () => {
    Swal.fire({
      title: 'Confirmation',
      html: `
      <div>
        <label>Select an option:</label>
        <select id="select-option" multiple>
          <option value="">-- Please select --</option>
          <option value="Address">Address</option>
          <option value="Age">Age</option>
          <option value="Bank Account Number">Bank Account Number</option>
          <option value="Credit Card Number">Credit Card Number</option>
          <option value="Email ID">Email ID</option>
          <option value="Name">Name</option>
          <option value="Phone Number">Phone Number</option>
          <option value="Social Security Number">Social Security Number</option>
          <option value="URL">URL</option>
          <option value="Gender">Gender</option>
          <option value="Driver's License Number">Driver's License Number</option>
        </select>
      </div>
    `,
      showCancelButton: true,
      confirmButtonText: 'Confirm',
      cancelButtonText: 'Cancel',
      preConfirm: () => {
        const selectOption = document.getElementById('select-option');
        // const redactAudio = document.getElementById('redact-audio');
        // const redactVideo = document.getElementById('redact-video');
        const result = {
          selectedOption: selectOption.value,
          // redactAudio: redactAudio.checked,
          // redactVideo: redactVideo.checked,
          redactPii: redactPii,
        };
        if (!selectOption.value) {
          Swal.showValidationMessage('Please select an option');
        } else {
          return result;
        }
      },
      allowOutsideClick: () => !Swal.isLoading(),
    }).then((result) => {
      if (result.isConfirmed) {
        const selectedOptions = Array.from(document.getElementById('select-option').selectedOptions).map(option => option.value);
        PII_operations(input_gs_path, transcriptions, entiretranscription, selectedOptions)
      }
    }
    );
  };

  function PII_operations(input_gs_path, transcriptions, entireTranscription, selectedOptions) {
    // get all the selected options from multiple select
    // call the identify_PII function to identify PII
    // setProgress(5);
    // setProgressMessage('Identifying PII from Transcription');

    const PII = async (input_gs_path, transcriptions, entireTranscription, selectedOptions) => {

      setProgress(20);
      setProgressMessage('Identifying PII from Transcription');
      const response = await identify_PII(selectedOptions, entireTranscription, transcriptions);

      const pii = response
      console.log(typeof (response))
      console.log(pii);

      function extractJSONValues(obj) {
        let values = [];
        for (let key in obj) {
          if (typeof obj[key] === "object") {
            if (Array.isArray(obj[key])) {
              values = values.concat(obj[key]);
            } else {
              values = values.concat(extractJSONValues(obj[key]));
            }
          } else {
            //check for null values
            if (obj[key] != null) {
              values.push(obj[key]);
            }
          }
        }
        return values;
      }
      // extract the pii values from the response
      const pii_values = extractJSONValues(pii);

      console.log(pii_values);

      // remove duplicates from the pii_values list
      let pii_final = [...new Set(pii_values)];

      console.log("after removing duplicates", pii_final);

      // modify the transcriptions to a list of objects with text, timestamp, end
      const word_timestamp_array = [];
      for (var i = 0; i < transcriptions.length; i++) {
        var start = transcriptions[i].timestamp;
        var end = transcriptions[i].end;
        var word = transcriptions[i].text;
        word_timestamp_array.push([word, start, end]);
      }
      console.log(word_timestamp_array);

      setProgress(40);
      setProgressMessage('Identying PII Timestamps');
      //  call the silence_PII function to silence PII
      const silence_interval = await Silence_interval(pii_final, word_timestamp_array);
      console.log(silence_interval);

      setProgress(60);
      setProgressMessage('Extracting Audio from Video');
      // extract audio from the video
      const audio_url = await extract_audio(input_gs_path);
      console.log(audio_url);

      setProgress(70);
      setProgressMessage('Muting PII in Audio');
      // call the silence_audio function to silence the audio
      const silence_audio = await muting_audio(audio_url[0], silence_interval);

      setProgress(80);
      setProgressMessage('Merging Muted Audio with Video');

      // merge silence_audio with the video
      const merge_audio_video = await merge_silenced_audio(input_gs_path, silence_audio[0]);

      setProgress(90);
      setProgressMessage('Transcribing PII redacted Video');

      // extract audio from the video
      const new_audio_url = await extract_audio(merge_audio_video[0]);
      console.log(new_audio_url);

      const transcript = await get_transcript(new_audio_url[0]);

      console.log("transcript:", transcript.transcript);

      setEntireTranscription(transcript.transcript);
      setVideoUrl(merge_audio_video[1]);
      setInput_gs_path(merge_audio_video[0]);
      // extract from json
      const word_timestamps = transcript.word_timestamps;
      const word_transcriptions = [];
      for (var i = 0; i < word_timestamps.length; i++) {
        var start = word_timestamps[i][1];
        var end = word_timestamps[i][2];
        var word = word_timestamps[i][0];
        var obj = {
          text: word,
          timestamp: start,
          end: end
        };
        word_transcriptions.push(obj);
      }
      setTranscriptions(word_transcriptions);
      setProgress(100);
      setProgressMessage('Done');
    }
    PII(input_gs_path, transcriptions, entireTranscription, selectedOptions);
  }

  return (
    <>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          minHeight: "100vh",
          background: "linear-gradient(90deg, #ff755f 20%, #ff6b9b 80%)",
          color: "white",
          padding: "10px"
        }}
      >
        <IconButton edge="start" color="inherit" aria-label="logo" sx={{ mr: 2 }}>
          <img src={logo} alt="EditScape Logo" height="40" />
        </IconButton>
        <TextField
          label="YouTube URL"
          value={youtubeUrl}
          onChange={(e) => setYoutubeUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              DownloadVideo(e.target.value);
            }
          }}
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
        <div>
          <Backdrop open={progress > 0} style={{ zIndex: 9999 }}>
            <Box display="flex" flexDirection="column" alignItems="center">
              <CircularProgress variant="determinate" value={progress} />
              <Typography variant="body1" style={{ marginTop: '1rem' }}>
                {`${Math.round(progress)}%`}
              </Typography>
              <Typography variant="body1" style={{ marginTop: '1rem' }}>
                {progressMessage}
              </Typography>
              {progress === 100 && (
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => setProgress(0)}
                  style={{ marginTop: '1rem' }}
                >
                  Close
                </Button>
              )}
            </Box>
          </Backdrop>
        </div>

        <FormGroup
          row
          sx={{ color: "black", justifyContent: "center", marginBottom: "16px" }}
        >
          <FormControlLabel
            control={
              <Switch
                checked={trimoperations}
                onChange={(event) => { setTrimoperations(event.target.checked); setShowTrimPopup(event.target.checked); }}
                name="Trim Video"
                color="primary"
              />
            }
            label="Trim Video"
          />
          <Dialog open={showTrimPopup} onClose={() => setShowTrimPopup(false)}>
            <DialogTitle>Trim Video</DialogTitle>
            <DialogContent>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span>Start Time</span>
                  <span>{`${startSeconds}s`}</span>
                </div>
                <Slider
                  value={startSeconds}
                  onChange={(event, newValue) => {
                    setStartSeconds(newValue);
                  }}
                  valueLabelDisplay="auto"
                  aria-labelledby="start-time-slider"
                  marks={[{ value: 0, label: "0s" }, { value: 30, label: "30s" }, { value: 60, label: "1m" }]}
                  min={0}
                  max={60}
                />
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span>End Time</span>
                  <span>{`${endSeconds}s`}</span>
                </div>
                <Slider
                  value={endSeconds}
                  onChange={(event, newValue) => {
                    setEndSeconds(newValue);
                  }}
                  valueLabelDisplay="auto"
                  aria-labelledby="end-time-slider"
                  marks={[{ value: 0, label: "0s" }, { value: 30, label: "30s" }, { value: 60, label: "1m" }]}
                  min={0}
                  max={60}
                />
              </div>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setShowTrimPopup(false)}>Cancel</Button>
              <Button onClick={handleTrimOkClick}>OK</Button>
            </DialogActions>
          </Dialog>

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
                onChange={(event) => { setRedactPii(event.target.checked); handleConfirm() }}
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
                onChange={(event) => { setRemoveSilences(event.target.checked); setShowSilencePopup(event.target.checked) }}
                name="removeSilences"
                color="primary"
              />
            }
            label="Remove Silences"
          />
          <Dialog open={showSilencePopup} onClose={() => setShowSilencePopup(false)}>
            <DialogTitle>Remove Silences</DialogTitle>
            <DialogContent>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span>Frequency(dB)</span>
                  <span>{`${frequencyInDB} dB`}</span>
                </div>
                <Slider
                  value={frequencyInDB}
                  onChange={(event, newValue) => {
                    setFrequencyInDB(newValue);
                  }}
                  valueLabelDisplay="auto"
                  aria-labelledby="frequency-slider"
                  marks={[
                    { value: -100 },
                    { value: -70 },
                    { value: -50 },
                    { value: 0 },
                    { value: 25 },
                  ]}
                  min={-100}
                  max={50}
                />
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span>Minimum Silence(ms)</span>
                  <span>{`${silenceIntervals} ms`}</span>
                </div>
                <Slider
                  value={silenceIntervals}
                  onChange={(event, newValue) => {
                    setSilenceIntervals(newValue);
                  }}
                  valueLabelDisplay="auto"
                  aria-labelledby="silence-intervals-slider"
                  marks={[
                    { value: 0, label: "0ms" },
                    { value: 500, label: "0.5s" },
                    { value: 1000, label: "1s" },
                    { value: 2000, label: "2s" },
                    { value: 3000, label: "3s" },
                  ]}
                  min={0}
                  max={3000}
                />
              </div>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setShowSilencePopup(false)}>Cancel</Button>
              <Button onClick={handleSilenceOkClick}>OK</Button>
            </DialogActions>
          </Dialog>
          {/* <FormControlLabel
            control={
              <Switch
                checked={removeBg}
                onChange={(event) => setremoveBg(event.target.checked)}
                name="RemoveBg"
                color="primary"
              />
            }
            label="Remove Bg"
          /> */}
          <FormControlLabel
            control={
              <Switch
                checked={changeResolution}
                onChange={(event) => { setShowResolutionPopup(event.target.checked); setChangeResolution(event.target.checked) }}
                name="ChangeResolution"
                color="primary"
              />
            }
            label="Change Resolution"
          />
        </FormGroup>
        <Dialog open={showResolutionPopup}>
          <DialogContent>
            <FormControl>
              <InputLabel id="resolution-select-label">Select resolution</InputLabel>
              <Select
                labelId="resolution-select-label"
                id="resolution-select"
                value={selectedOption}
                onChange={(event) => setSelectedOption(event.target.value)}
              >
                <MenuItem value="256x144">144p</MenuItem>
                <MenuItem value="426x240">240p</MenuItem>
                <MenuItem value="640x360">360p</MenuItem>
                <MenuItem value="854x480">480p</MenuItem>
                <MenuItem value="1280x720">720p</MenuItem>
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowResolutionPopup(false)}>Cancel</Button>
            <Button onClick={handleChangeResolutionOkClick}>OK</Button>
          </DialogActions>
        </Dialog>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            width: '100%',
            height: '100%',
          }}
        >
          <VideoPreview
            transcript={transcriptions}
            url={videoUrl}
            playing={videoState.playing}
            onProgress={handleProgress}
            onPlay={() => setVideoState({ ...videoState, playing: true })}
            onPause={() => setVideoState({ ...videoState, playing: false })}
            seekTo={videoState.seekTo}
          // seekToTranscription={(timestamp) => handleTranscriptionClick(timestamp)}
          />
          <TranscriptionQuill
            onReplaceTranscription={handleReplaceTranscription}
            input_gs_path={input_gs_path}
            transcriptions={transcriptions}
            currentTime={videoState.currentTime}
            onTranscriptionClick={handleTranscriptionClick}
            onWordContextMenu={handleWordContextMenu}
            onDeleteTranscriptions={handleDeleteTranscriptions}
            onConcatenateVideo={handleConcatenateVideo}
          />
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
            <MenuItem onClick={() => { generateTinyURL() }}>Share</MenuItem>
            <MenuItem onClick={() => {
              const link = document.createElement("a");
              link.href = videoUrl;
              link.download = "video.mp4";
              link.target = "_blank";
              // Trigger a click event on the link to initiate the download
              link.dispatchEvent(new MouseEvent("click"));

            }}>Export Video</MenuItem>
            <MenuItem onClick={
              () => {

                function convertToSRT(wordTimestamps) {
                  let srt = "";
                  let subtitleNumber = 1;

                  for (let i = 0; i < wordTimestamps.length; i++) {
                    const { text, timestamp, end } = wordTimestamps[i];
                    const sentence = constructSentence(wordTimestamps, i);
                    const startTime = convertToTimecode(timestamp);
                    const endTime = convertToTimecode(end);

                    srt += `${subtitleNumber}\n${startTime} --> ${endTime}\n${sentence}\n\n`;
                    subtitleNumber++;
                  }

                  return srt;
                }

                function convertToTimecode(timestamp) {
                  const hours = Math.floor(timestamp / 3600);
                  const minutes = Math.floor((timestamp % 3600) / 60);
                  const seconds = Math.floor(timestamp % 60);
                  const milliseconds = Math.floor((timestamp % 1) * 1000);
                  const timecode = `${padNumber(hours)}:${padNumber(minutes)}:${padNumber(seconds)},${padNumber(milliseconds, 3)}`;

                  return timecode;
                }

                function padNumber(number, length = 2) {
                  return number.toString().padStart(length, '0');
                }

                function constructSentence(wordTimestamps, currentIndex) {
                  const currentWord = wordTimestamps[currentIndex];
                  let sentence = currentWord.text;
                  let prevTimestamp = currentWord.timestamp;

                  for (let i = currentIndex + 1; i < wordTimestamps.length; i++) {
                    const word = wordTimestamps[i];

                    if (word.timestamp - prevTimestamp <= 0.5) { // Adjust the time threshold as needed
                      sentence += " " + word.text;
                      prevTimestamp = word.timestamp;
                    } else {
                      break;
                    }
                  }

                  return sentence;
                }

                function downloadSRT(filename, content) {
                  const element = document.createElement('a');
                  const blob = new Blob([content], { type: 'application/x-subrip' });
                  element.href = URL.createObjectURL(blob);
                  element.download = filename;
                  document.body.appendChild(element);
                  element.click();
                  document.body.removeChild(element);
                }

                const srtContent = convertToSRT(transcriptions);
                downloadSRT('subtitle.srt', srtContent);

              }
            }>Download SRT</MenuItem>
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
        </Box>
      </Box>
      <ToastContainer
        position='bottom-right'
        autoClose={3000}
        hideProgressBar={true}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        pauseOnHover
      />
    </>
  );
};

export default EditorPage;