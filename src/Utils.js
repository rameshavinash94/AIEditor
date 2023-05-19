async function remove_filler_words(input_gs_path, wordtranscript, fillerWords) {
    let fillerWordSegments = [];
    console.log("Inside remove_filler_words function");
    console.log(fillerWords);
    console.log(wordtranscript.length);
    // loop through the wordtranscript and create segements of filler words to remove with the start(wordtranscript.timestamp) and end time(wordtranscript.end) of the filler word
    // store it in a list of dictionary with start and end time
    for (let i = 0; i < wordtranscript.length; i++) {
        if (fillerWords.includes(wordtranscript[i].text.toLowerCase().replace(/[^\w\s]/gi, ''))) {
            console.log(wordtranscript[i].text,wordtranscript[i].timestamp,wordtranscript[i].end);
            // create a dictionary with start and end time
            let Segment;
            Segment = {
                "start": wordtranscript[i].timestamp,
                "end": wordtranscript[i].end
            }
            fillerWordSegments.push(Segment);
        }
    }
    console.log(fillerWordSegments);
    if (fillerWordSegments.length > 0) {
    try {
        const response = await fetch('https://us-west2-aieditorv1.cloudfunctions.net/cuts_video', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                'input_gs_path': input_gs_path,
                'segments_to_remove': fillerWordSegments
            })
        });
        console.log(response);
        const json = await response.json();
        const output_gs_path = json.output_gs_path;
        const public_shared_url = json.public_shared_url;
        console.log(output_gs_path,public_shared_url);
        return [output_gs_path, public_shared_url];
    } catch (error) {
        console.log(error);
    }
}
else {
    console.log("No filler words found");
    return "No filler words found";
}
}

async function identify_PII(categories,transcript)
{
    console.log(categories);
    console.log(transcript)
    let new_transcript = '"' + transcript.toString() + '"';
    console.log(new_transcript);
    //convert the values of all categories to string
    for (let i = 0; i < categories.length; i++) {
        categories[i] = '"' + categories[i].toString() + '"';
    }
    console.log(categories);
    
    console.log("hi, I'm inside identify_PII");
    try {
        const response = await fetch('https://us-west2-aieditorv1.cloudfunctions.net/extract_pii', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                "input_text": new_transcript,
                "categories": categories
            })
        });
        console.log(response);
        const json = await response.json();
        console.log(json);

       return json;
    } catch (error) {
        console.log(error);
    }

}

async function muting_audio(input_gs_path,interval)
{
    console.log("hi, I'm inside muting_audio");
    try {
        const response = await fetch('https://us-west2-aieditorv1.cloudfunctions.net/mute_audio_multiple_intervals', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                'input_gs_path': input_gs_path,
                'interval': interval
            })
        });
        console.log(response);
        const json = await response.json();
        const output_gs_path = json.output_gs_path;
        const public_shared_url = json.public_shared_url;
        console.log(output_gs_path,public_shared_url);
        return [output_gs_path, public_shared_url];
    } catch (error) {
        console.log(error);
    }
}

async function merge_silenced_audio(video_url,muted_audio_url)
{
    console.log("hi, I'm inside muting_audio");
    try {
        const response = await fetch('https://us-west2-aieditorv1.cloudfunctions.net/merge_new_audio_with_audio', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                'input_gs_video_path': video_url,
                'input_gs_audio_path': muted_audio_url
            })
        });
        console.log(response);
        const json = await response.json();
        const output_gs_path = json.output_gs_path1;
        const public_shared_url = json.public_shared_url;
        console.log(output_gs_path,public_shared_url);
        return [output_gs_path, public_shared_url];
    } catch (error) {
        console.log(error);
    }
}

async function Silence_interval(values,transcript)
{
    console.log(values);
    console.log(transcript);
    console.log("hi, I'm inside Silence_interval");
    try {
        const response = await fetch('https://us-west2-aieditorv1.cloudfunctions.net/silence_interval', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                'input_text': values,
                'word_timestamps': transcript
            })
        });
        console.log(response);
        const json = await response.json();
        console.log(json);
       return json;
    } catch (error) {
        console.log(error);
    }
}



async function change_resolution(input_gs_path,resolution)
{
    // let new_input_gs_path = '"' + input_gs_path.toString() + '"';
    // let new_resolution = '"' + resolution.toString() + '"';

    console.log("hi, I'm inside change_resolution");
    // console.log(new_input_gs_path,new_resolution);
    try {
        const response = await fetch('https://us-west2-aieditorv1.cloudfunctions.net/check_video_resolution', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                "input_gs_path": input_gs_path,
                "resolution": resolution
            })
        });
        console.log(response);
        const json = await response.json();
        const output_gs_path = json.output_gs_path;
        const public_shared_url = json.public_shared_url;
        console.log(output_gs_path,public_shared_url);
        return [output_gs_path, public_shared_url];
    } catch (error) {
        console.log(error);
    }
}

async function remove_silences(input_gs_path,frequencyInDB,silenceIntervals)
{
    console.log("hi, I'm inside remove_silences");
    try {
        const response = await fetch('https://us-west2-aieditorv1.cloudfunctions.net/remove_silences', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                'input_gs_path': input_gs_path,
                'silence_threshold': frequencyInDB,
                'min_silence_duration': silenceIntervals
            })
        });
        console.log(response);
        const json = await response.json();

        const output_gs_path = json.output_gs_path;
        const public_shared_url = json.public_shared_url;
        console.log(output_gs_path,public_shared_url);
        return [output_gs_path, public_shared_url];
    } catch (error) {
        console.log(error);
    }

}

async function trim_operations(input_gs_path, start_time, end_time)
{
    try {
        const response = await fetch('https://us-west2-aieditorv1.cloudfunctions.net/trim_video', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                'input_gs_path': input_gs_path,
                'start': start_time,
                'end': end_time
            })
        });
        console.log(response);
        const json = await response.json();
        const output_gs_path = json.output_gs_path;
        const public_shared_url = json.public_shared_url;
        console.log(output_gs_path,public_shared_url);
        return [output_gs_path, public_shared_url];
    } catch (error) {
        console.log(error);
    }


}

async function cut_operation(input_gs_path, start_time, end_time)
{
    let segments_to_remove = [
        {
            "start": start_time,
            "end": end_time
        }
    ]
    try {
        const response = await fetch('https://us-west2-aieditorv1.cloudfunctions.net/cuts_video', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                'input_gs_path': input_gs_path,
                'segments_to_remove': segments_to_remove
            })
        });
        console.log(response);
        const json = await response.json();
        const output_gs_path = json.output_gs_path;
        const public_shared_url = json.public_shared_url;
        console.log(output_gs_path,public_shared_url);
        return [output_gs_path, public_shared_url];
    } catch (error) {
        console.log(error);
    }
}


async function copy_video(input_gs_path)
{
    console.log("hi, I'm inside copy_video");
    try {
        const response = await fetch('https://us-west2-aieditorv1.cloudfunctions.net/copy_blob', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                'input_gs_path': input_gs_path
            })
        });
        console.log(response);
        const json = await response.json();
        const output_gs_path = json.output_gs_path;
        const public_shared_url = json.public_shared_url;
        console.log(output_gs_path,public_shared_url);
        return [output_gs_path, public_shared_url];
    } catch (error) {
        console.log(error);
    }

}

async function merge_video(input_gs_path1,input_gs_path2,replace_start,replace_end)
{
    console.log("hi, I'm inside merge_video");
    try {
        const response = await fetch('https://us-west2-aieditorv1.cloudfunctions.net/concatenate_video', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                'input1_gs_path': input_gs_path1,
                'input2_gs_path': input_gs_path2,
                'replace_start': replace_start,
                'replace_end': replace_end
            })
        });
        console.log(response);
        const json = await response.json();
        const output_gs_path = json.output_gs_path;
        const public_shared_url = json.public_shared_url;
        console.log(output_gs_path,public_shared_url);
        return [output_gs_path, public_shared_url];
    } catch (error) {
        console.log(error);
    }
}

async function download_yt_video(url,name) {
    console.log("hi, I'm inside download_yt_video");
    console.log(url);
    let input_gs_path = `gs://editor_user/test_user/test_project/source_files/${name}_youtube_video.mp4`
    console.log(input_gs_path);
    try {
        const response = await fetch('https://us-west2-aieditorv1.cloudfunctions.net/ytdl', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                'URL': url,
                'input_gs_path': input_gs_path
            })
        });
        console.log(response);
        const json = await response.json();
        const output_gs_path = json.output_gs_path;
        const public_shared_url = json.public_shared_url;
        console.log(output_gs_path,public_shared_url);
        return [output_gs_path, public_shared_url];
    } catch (error) {
        console.log(error);
    }
}

async function extract_audio(input_gs_path)
{
    console.log("hi, I'm inside extract_audio");
    try {
        const response = await fetch('https://us-west2-aieditorv1.cloudfunctions.net/extract_audio_channel', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                'input_gs_path': input_gs_path
            })
        });
        console.log(response);
        const json = await response.json();
        const output_gs_path = json.output_gs_path;
        const public_shared_url = json.public_shared_url;
        console.log(output_gs_path,public_shared_url);
        return [output_gs_path, public_shared_url];
    } catch (error) {
        console.log(error);
    }
}

async function get_transcript(input_gs_path)
{
    console.log(input_gs_path);

    console.log("hi, I'm inside get transcript");
    try {
        const response = await fetch('https://us-west2-aieditorv1.cloudfunctions.net/transcribe_audio', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                'input_gs_path': input_gs_path
            })
        });
        console.log(response);
        const json = await response.json();
        console.log(json);
        return json;
    } catch (error) {
        console.log(error);
    }
}

async function voice_cloning(input_gs_path,input_text)
{
    console.log("hi, I'm inside voice_cloning");
    try {
        const response = await fetch('https://us-west2-aieditorv1.cloudfunctions.net/voice_clonning', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                'input_gs_path': input_gs_path,
                'input_text': input_text
            })
        });
        console.log(response);
        const json = await response.json();
        const output_gs_path = json.output_gs_path;
        const public_shared_url = json.public_shared_url;
        console.log(output_gs_path,public_shared_url);
        return [output_gs_path, public_shared_url];
    } catch (error) {
        console.log(error);
    }
}

async function lip_sync(input_gs_path,audio_url,video_url)
{
    console.log("hi, I'm inside lip_sync");
    try {
        const response = await fetch('https://us-west2-aieditorv1.cloudfunctions.net/lip-sync', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                'audio_url': audio_url,
                'video_url': video_url,
                'input_gs_path': input_gs_path
            })
        });
        console.log(response);
        const json = await response.json();
        const output_gs_path = json.output_gs_path;
        const public_shared_url = json.public_shared_url;
        console.log(output_gs_path,public_shared_url);
        return [output_gs_path, public_shared_url];
    }
     catch (error) {
        console.log(error);
    }
}

export { download_yt_video,extract_audio,get_transcript,copy_video,remove_silences,remove_filler_words,cut_operation,trim_operations,identify_PII,Silence_interval,change_resolution,merge_video,lip_sync,voice_cloning,muting_audio,merge_silenced_audio};