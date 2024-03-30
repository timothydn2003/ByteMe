import { useEffect, useRef, useState } from 'react';
import { storage } from '../../firebase-config';
import useSound from 'use-sound'; // for handling the sound
import { AiFillPlayCircle, AiFillPauseCircle } from 'react-icons/ai'; // icons for play and pause
import { BiSkipNext, BiSkipPrevious } from 'react-icons/bi'; // icons for next and previous track
import { IconContext } from 'react-icons';

import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// CSS imports
import '../../css/Transcripts/AudioTranscriber.css';

export const AudioComponent = () => {
    const [uploaded, setUploaded] = useState({
        fileUrl: '',
    });
    // Reference to the file input element
    const fileInputRef = useRef(null);

    const handleButtonClick = () => {
        fileInputRef.current.click();
    };

    const uploadFile = async (file) => {
        const storageRef = ref(storage, 'uploads/' + file.name);

        if (!file) return;

        try {
            const fileRef = await uploadBytes(storageRef, file);
            console.log('File uploaded successfully:', fileRef);
            return fileRef;
        } catch (error) {
            console.error('Error uploading file:', error);
            return null;
        }
    };

    const retrieveFileUrl = async (fileRef) => {
        // name of file ref to create a ref blob
        const fileName = fileRef.metadata.fullPath;

        const fileUrl = await getDownloadURL(ref(storage, fileName));
        return fileUrl;
    };

    // Function to handle file selection
    const handleFileChange = async (event) => {
        const selectedFile = event.target.files[0];
        const fileRef = await uploadFile(selectedFile);

        if (!fileRef) return;
        console.log('File reference:', fileRef);

        const fileUrl = await retrieveFileUrl(fileRef);

        // Set the uploaded state to true
        setUploaded({
            fileUrl,
        });
    };

    return (
        <>
            <button className="audio-component" onClick={handleButtonClick}>
                <h2 className="title">Upload an audio file</h2>

                <input
                    type="file"
                    ref={fileInputRef}
                    accept="audio/*"
                    className=""
                    onChange={handleFileChange}
                />
            </button>

            {uploaded.fileUrl !== '' && (
                <AudioVisualizer src={uploaded.fileUrl} />
            )}
        </>
    );
};

const AudioVisualizer = ({ src }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [time, setTime] = useState({
        min: '',
        sec: '',
    });
    const [currTime, setCurrTime] = useState({
        min: '',
        sec: '',
    });

    const [seconds, setSeconds] = useState();

    const [play, { pause, duration, sound }] = useSound(src);

    useEffect(() => {
        if (duration) {
            const sec = duration / 1000;
            const min = Math.floor(sec / 60);
            const secRemain = Math.floor(sec % 60);
            setTime({
                min: min,
                sec: secRemain,
            });
        }
    }, [isPlaying]);

    useEffect(() => {
        const interval = setInterval(() => {
            if (sound) {
                setSeconds(sound.seek([]));
                const min = Math.floor(sound.seek([]) / 60);
                const sec = Math.floor(sound.seek([]) % 60);
                setCurrTime({
                    min,
                    sec,
                });
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [sound]);

    const playingButton = () => {
        if (isPlaying) {
            pause();
            setIsPlaying(false);
        } else {
            play();
            setIsPlaying(true);
        }
    };

    return (
        <div className="component">
            <div>
                <div className="time">
                    <p>
                        {currTime.min}:{currTime.sec}
                    </p>
                    <p>
                        {time.min}:{time.sec}
                    </p>
                </div>
                <input
                    type="range"
                    min="0"
                    max={duration / 1000}
                    default="0"
                    value={seconds}
                    className="timeline"
                    onChange={(e) => {
                        sound.seek([e.target.value]);
                    }}
                />
            </div>
            <div>
                <button className="playButton">
                    <IconContext.Provider
                        value={{ size: '2em', color: '#22223b' }}
                    >
                        <BiSkipPrevious />
                    </IconContext.Provider>
                </button>
                {!isPlaying ? (
                    <button className="playButton" onClick={playingButton}>
                        <IconContext.Provider
                            value={{ size: '2em', color: '#22223b' }}
                        >
                            <AiFillPlayCircle />
                        </IconContext.Provider>
                    </button>
                ) : (
                    <button className="playButton" onClick={playingButton}>
                        <IconContext.Provider
                            value={{ size: '2em', color: '#22223b' }}
                        >
                            <AiFillPauseCircle />
                        </IconContext.Provider>
                    </button>
                )}
                <button className="playButton">
                    <IconContext.Provider
                        value={{ size: '2em', color: '#22223b' }}
                    >
                        <BiSkipNext />
                    </IconContext.Provider>
                </button>
            </div>
        </div>
    );
};