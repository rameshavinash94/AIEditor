import React, { useEffect, useRef, useState } from "react";
import "../css/TranscriptionQuill.css"; // Import custom CSS
import {cut_operation,copy_video,extract_audio,get_transcript,merge_video,download_yt_video,lip_sync,voice_cloning,trim_operations } from "../Utils.js";
import CircularProgress from '@mui/material/CircularProgress';
import Backdrop from '@mui/material/Backdrop';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Swal from 'sweetalert2'

function TranscriptionQuill({
  onReplaceTranscription,
  input_gs_path,
  transcriptions,
  currentTime,
  onTranscriptionClick,
  onDeleteTranscriptions,
  onConcatenateVideo,
}) {
  const transcriptionContainerRef = useRef(null);
  const [selectedFontSize, setSelectedFontSize] = useState("16px");
  const [selectedFontFamily, setSelectedFontFamily] = useState("Arial");
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = React.useState('');

  let gs_path = input_gs_path;

  useEffect(() => {
    if (transcriptionContainerRef.current) {
      const   transcriptEls = transcriptionContainerRef.current.getElementsByClassName(
        "transcription"
      );

      // Update active transcript
      for (const el of transcriptEls) {
        const timestamp = parseFloat(el.dataset.timestamp);
        if (
          timestamp <= currentTime &&
          (!el.nextElementSibling ||
            parseFloat(el.nextElementSibling.dataset.timestamp) > currentTime)
        ) {
          el.classList.add("active");
        } else {
          el.classList.remove("active");
        }
      }
    }
  }, [transcriptionContainerRef, currentTime, transcriptions]);

  const handleFontSizeChange = (e) => {
    setSelectedFontSize(e.target.value);
  };

  const handleFontFamilyChange = (e) => {
    setSelectedFontFamily(e.target.value);
  };

  const handleTranscriptionContainerClick = (e) => {
    if (e.target.classList.contains("transcription")) {
      const timestamp = parseFloat(e.target.dataset.timestamp);
      onTranscriptionClick(timestamp);

    }
  };

  const handle_replace = async (gs_path, minStart, maxEnd,replace_text) => {
    setProgress(5);
    setProgressMessage('Extracting the audio from the video.');

    const extract = await extract_audio(gs_path);
    const audio_gs_url = extract[0]

      // call the voice cloning function

      setProgress(10);
      setProgressMessage('Voice Cloning in progress... It may take a few minutes. Please be patient.');
        const response1 = await voice_cloning(audio_gs_url,replace_text);
        const public_shared_url1 = response1[1]
        const video_gs_url1 = response1[0]

       // call the trim_operations function
       setProgress(40);
      setProgressMessage('Trimming the video.');
       const response = await trim_operations(gs_path, minStart, maxEnd);
       const public_shared_url = response[1]
       const video_gs_url = response[0]
      
      // call the lip_sync function
      setProgress(70);
      setProgressMessage('Lip Syncing in progress... It may take a few minutes. Please be patient.');
        const response2 = await lip_sync(gs_path,public_shared_url1,public_shared_url);
        const public_shared_url2 = response2[1]
        const video_gs_url2 = response2[0]
      
      // call the merge_video function
      setProgress(80);
      setProgressMessage('Merging the video with the new audio and lip sync.');
        const response3 = await merge_video(gs_path,video_gs_url2,minStart,maxEnd);
        const public_shared_url3 = response3[1]
        const video_gs_url3 = response3[0]
      
      // call the copy_video function
        const response4 = await copy_video(video_gs_url3);
      
      // call the extract_audio function
      setProgress(85);
      setProgressMessage('Extracting audio from the video.');
        const response5 = await extract_audio(video_gs_url3);

      // call the get_transcript function
      setProgress(90);
      setProgressMessage('Transcribing the new audio.');
        const transcript = await get_transcript(response5[0]);
        const word_timestamps = transcript.word_timestamps;
        const entiretranscription = transcript.transcript;
        const newtranscriptions = [];
        for (var i = 0; i < word_timestamps.length; i++) {
          var start = word_timestamps[i][1];
          var end = word_timestamps[i][2];
          var word = word_timestamps[i][0];
          var obj = {
            text: word,
            timestamp: start,
            end: end
          };
          newtranscriptions.push(obj);
        }
        setProgress(100);
        setProgressMessage('Done!');
        return [newtranscriptions, public_shared_url3, entiretranscription, video_gs_url3];
  };

  const cut_video = async (gs_path,minStart,maxEnd) => {
    if (minStart === Infinity || maxEnd === -Infinity) {
      return null;
    }
    if (minStart === maxEnd) {
      return null;
    }

    if (minStart === 0 && maxEnd === Infinity) {
      return null;
    }

    if (minStart === 0 && maxEnd === -Infinity) {
      return ;
    }

    if (gs_path === null || gs_path === undefined || gs_path === "") {
      return "gs_path is null";
    }
    setProgress(15);
    setProgressMessage("Cutting video...");

    const response = await cut_operation(gs_path, minStart, maxEnd);

    const public_shared_url = response[1]
  const video_gs_url = response[0]
  setProgress(25);
    setProgressMessage("Copying video...");
    const blob = await copy_video(video_gs_url);
    setProgress(50);
    setProgressMessage("Extracting audio...");
    const audio_url = await extract_audio(video_gs_url);
    setProgress(75);
    setProgressMessage("Transcribing new audio...");
    const transcript = await get_transcript(audio_url[0]);

    const word_timestamps = transcript.word_timestamps;
  const entiretranscription = transcript.transcript;

  const newtranscriptions = [];
  for (var i = 0; i < word_timestamps.length; i++) {
    var start = word_timestamps[i][1];
    var end = word_timestamps[i][2];
    var word = word_timestamps[i][0];
    var obj = {
      text: word,
      timestamp: start,
      end: end
    };
    newtranscriptions.push(obj);
  }
  return [newtranscriptions, public_shared_url, entiretranscription, video_gs_url];
  }

  async function handleRemoveTranscription() {
    let start, end;
    const selection = window.getSelection();
    console.log("selection", selection);
    const selectedText = selection.toString();
    const selectedRange = selection.getRangeAt(0);
    if (!selectedRange.collapsed) {
      const selectedSpans = Array.from(transcriptionContainerRef.current.querySelectorAll('.transcription'))
        .filter(span => {
          const spanRange = document.createRange();
          spanRange.selectNode(span);
  
          return (
            selectedRange.compareBoundaryPoints(Range.START_TO_END, spanRange) === 1 &&
            selectedRange.compareBoundaryPoints(Range.END_TO_START, spanRange) === -1
          );
        });
  
      const selectedstartTimestamps = selectedSpans.map(span => span.getAttribute('data-timestamp'));
      const selectedendTimestamps = selectedSpans.map(span => span.getAttribute('data-endtimestamp'));
  
      // Use the selected timestamps for further processing or manipulation
      console.log('Selected Timestamps:', selectedstartTimestamps,selectedendTimestamps);
      console.log('Selected Text:', selectedText);
      start = selectedstartTimestamps[0];
      end = selectedendTimestamps[selectedendTimestamps.length-1];
    }
    setProgress(5);
    setProgressMessage("Searching and extracting transcriptions timestamps...");

    console.log(start,end);

    let response = await cut_video(gs_path,start,end);

    setProgress(100);
    setProgressMessage("Done! ");
    onDeleteTranscriptions(response[0],response[1],response[2],response[3]);

  }

  async function handleReplaceTranscription() {
     let start, end;
    const selection = window.getSelection();
    console.log("selection", selection);
    const selectedText = selection.toString();
    const selectedRange = selection.getRangeAt(0);
    if (!selectedRange.collapsed) {
      const selectedSpans = Array.from(transcriptionContainerRef.current.querySelectorAll('.transcription'))
        .filter(span => {
          const spanRange = document.createRange();
          spanRange.selectNode(span);
  
          return (
            selectedRange.compareBoundaryPoints(Range.START_TO_END, spanRange) === 1 &&
            selectedRange.compareBoundaryPoints(Range.END_TO_START, spanRange) === -1
          );
        });
  
      const selectedstartTimestamps = selectedSpans.map(span => span.getAttribute('data-timestamp'));
      const selectedendTimestamps = selectedSpans.map(span => span.getAttribute('data-endtimestamp'));
  
      // Use the selected timestamps for further processing or manipulation
      console.log('Selected Timestamps:', selectedstartTimestamps,selectedendTimestamps);
      console.log('Selected Text:', selectedText);
      start = selectedstartTimestamps[0];
      end = selectedendTimestamps[selectedendTimestamps.length-1];
    }

    console.log(start,end);

    const { value: text } = await Swal.fire({
      title: "Replace transcription",
      input: "textarea",
      inputValue: selectedText,
      showCancelButton: true,
      inputValidator: (value) => {
        if (!value) {
          return "You need to write something!";
        }
      },
    });
  console.log(text);
  
  if (text === undefined || text === null || text === "") {
    return;
  }
  let final = await handle_replace(gs_path,start,end,text);
  onReplaceTranscription(final[0],final[1],final[2],final[3]);     
  }

  async function handleConcatenate() {
    //use Swal to display one text box to type video url to merge and another slider to type the timestamp to merge
    const { value: formValues } = await Swal.fire({
      title: 'Enter video url and timestamp to merge',
      html:
        '<label for="video-url">Video URL</label>' +
        '<input type="text" id="video-url" class="swal2-input" placeholder="Enter URL">' +
        '<label for="timestamp">Timestamp</label>' +
        '<input type="text" id="timestamp" class="swal2-input" placeholder="Enter Timestamp to Merge">' +
        '<output id="timestamp-output">0</output>',
      focusConfirm: false,
      preConfirm: () => {
        return [
          document.getElementById('video-url').value,
          document.getElementById('timestamp').value
        ];
      },
      didOpen: () => {
        const timestampInput = document.getElementById('timestamp');
        const output = document.getElementById('timestamp-output');
        timestampInput.addEventListener('input', () => {
          output.textContent = timestampInput.value;
        });
      },
      inputValidator: (values) => {
        const videoUrl = values[0];
        const timestamp = values[1];
        if (!videoUrl || !timestamp) {
          return 'Please enter a video URL and timestamp';
        }

        if (!videoUrl.includes("https://")) {
          return 'Please enter a valid video URL';
        }
      }
    }).then((result) => {
      if (result.isConfirmed) {
        console.log("result", result);
        handleMergeProcess(result.value[0],result.value[1]);
      }
    })
  }

  function handleMergeProcess(videoUrl,timestamp)
  {
    console.log("videoUrl", videoUrl);
    console.log("timestamp", timestamp);
  
  const MergeVideo = async (videoUrl,timestamp) => {
      // call the download_yt_video function to download the video from the url
      setProgress(5);
      setProgressMessage("Downloading video from Youtube...");
      let response = await download_yt_video(videoUrl,"test1");
      const video_gs_url = response[0]
      console.log("video_gs_url", video_gs_url);
      console.log("public_shared_url", public_shared_url);

      setProgress(40);
      setProgressMessage("Concatenating video...");
      // call the merge_video function to merge the video with the existing video
      console.log("Concatenating video");

      let response2 = await merge_video(gs_path,video_gs_url,timestamp,timestamp);
      const public_shared_url = response2[1]
      const gs_url = response2[0]
      console.log("public_shared_url", public_shared_url);
      console.log("gs_url", gs_url);

      setProgress(60);
      setProgressMessage("Copying video to Google Cloud...");
        const blob = await copy_video(gs_url);

        setProgress(80);
        setProgressMessage('Extracting audio from video');
        const audio_url = await extract_audio(gs_url);
  
        setProgress(90);
        setProgressMessage('Transcribing audio and extracting timestamps');
        const transcript = await get_transcript(audio_url[0]);
  
        console.log("transcript:",transcript.transcript);

        const entireTranscription = transcript.transcript;
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
        setProgress(100);
        setProgressMessage('Done');
      onConcatenateVideo(transcriptions,public_shared_url,entireTranscription,gs_url);
  }

  MergeVideo(videoUrl,timestamp);
  }

  return (
    <div>
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
      <div className="toolbar">
        <label htmlFor="font-size">Font Size:</label>
        <select
          id="font-size"
          value={selectedFontSize}
          onChange={handleFontSizeChange}
        >
          <option value="12px">12px</option>
          <option value="14px">14px</option>
          <option value="16px">16px</option>
          <option value="18px">18px</option>
          <option value="20px">20px</option>
        </select>
        <label htmlFor="font-family">Font Family:</label>
        <select
          id="font-family"
          value={selectedFontFamily}
          onChange={handleFontFamilyChange}
        >
          <option value="Arial">Arial</option>
          <option value="Verdana">Verdana</option>
          <option value="Courier New">Courier New</option>
          <option value="Georgia">Georgia</option>
          <option value="Times New Roman">Times New Roman</option>
        </select>
        <button onClick={handleRemoveTranscription}>Remove</button>
        <button onClick={handleReplaceTranscription}>Replace</button>
        <button onClick={handleConcatenate}>Merge Video</button>
        </div>
      <div
        ref={transcriptionContainerRef}
        className="transcription-container"
        contentEditable={false}
        onClick={handleTranscriptionContainerClick}
      >
        {transcriptions.map((t) => (
          <span
            key={t.timestamp}
            className="transcription"
            data-timestamp={t.timestamp}
            data-endtimestamp={t.end}
            style={{
              fontSize: selectedFontSize,
              fontFamily: selectedFontFamily
            }}
            onClick={() => onTranscriptionClick(t.timestamp)}
          >
            {`${t.text} `}
          </span>
        ))}
      </div>
      
    </div>
  );
}
export default TranscriptionQuill;