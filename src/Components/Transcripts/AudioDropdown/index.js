// CSS import
import { useState } from "react";
import "./AudioDropdown.css";
import { AudioVisualizer } from "../AudioTranscriber";
import { dateToFormat } from "../../Courses/CoursesSelector";

/*
interface audioRef {
    url: String;
    name: String; // name of the audio file
    type: String; 
    size: Number; 
    duration: Number;
    courseRef: String; // reference to the course
    createdAt: Date; // date created
}
*/

const tempText = `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean vel mattis dui, nec venenatis nisi. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam quam quam, venenatis vel est in, dictum molestie mi. Maecenas pulvinar molestie ultrices. Pellentesque id congue odio, vel blandit arcu. Praesent tincidunt elit non laoreet ultricies. Sed eu tempor felis. Morbi sed consequat erat.

Donec gravida libero ut accumsan suscipit. Aliquam ullamcorper nec nisl et mollis. Donec laoreet blandit purus quis ultricies. Nam nisl mauris, cursus at feugiat in, iaculis at nisl. Praesent dui risus, eleifend eget ultricies et, pellentesque ut erat. Nulla aliquet ullamcorper turpis, ac pretium dolor. Mauris aliquet id mi id lacinia. Fusce ultricies venenatis leo eget iaculis. Curabitur vel lectus lectus. Suspendisse varius tellus ac ipsum porta imperdiet. Pellentesque suscipit tempus bibendum. Sed est velit, consequat at magna at, lacinia elementum nibh. Mauris placerat accumsan magna at vulputate. Pellentesque volutpat turpis quis porttitor accumsan.`;

export const AudioDropdown = ({ audioRef }) => {
    const [displayTranscript, setDisplayTranscript] = useState(false);

    const formatDate = (date) => {
        // function to return dates in MM-DD-YYYY format
        // Thank you my sweet gibbity
        const dateObj = new Date(
            date.seconds * 1000 + date.nanoseconds / 1000000
        );
        const month = dateObj.getMonth() + 1;
        const day = dateObj.getDate();
        const year = dateObj.getFullYear();
        return `${month}-${day}-${year}`;
    };

    return (
        <div className="audio-dropdown-component-wrapper">
            <div className="audio-dropdown">
                <div className="icon-container">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className={`icon ${displayTranscript ? "open" : ""}`}
                        onClick={() => setDisplayTranscript(!displayTranscript)}
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="m19.5 8.25-7.5 7.5-7.5-7.5"
                        />
                    </svg>
                </div>

                <h3 className="audio-title">{audioRef.name}</h3>
                <p className="audio-date">{dateToFormat( 'MMM DD, YYYY', audioRef.createdAt.toDate())}</p>
                <p className="audio-type">{audioRef.type}</p>
            </div>

            {displayTranscript && (
                <>
                    <div className="audio-visualizer">
                        <AudioVisualizer src={audioRef.url} />
                    </div>

                    <div className="transcript-dialogue-container">
                        <TranscriptDialogue transcript={tempText} />
                    </div>
                </>
            )}
        </div>
    );
};

export const TranscriptDialogue = ({ transcript }) => {
    return (
        <div className="transcript-dialogue">
            {/* <h3 className="transcript-dialogue-speaker">{transcript.speaker}</h3> */}
            <p className="transcript-dialogue-text">{transcript}</p>
        </div>
    );
};
