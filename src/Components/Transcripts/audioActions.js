import { collection, addDoc } from "firebase/firestore";
import { db } from "../../firebase-config";
import { storage } from "../../firebase-config";

import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

/**
 * Function to upload audio file to OpenAI for transcription
 * @param {fileChunk} audioData File chunk to be uploaded
 * @param {string} fileName File name of the audio file
 * @returns String of the transcription | null if failed
 */
export const uploadAudioForTranscription = async (audioData, fileName) => {
  // DOCS: https://ffmpegwasm.netlify.app/
  // idea from: https://github.com/briansunter/chunk-audio/blob/master/src/App.tsx

  // convert to blob for upload
  const blob = new Blob([audioData], { type: "audio/mpeg" });

  // form for upload
  const formData = new FormData();
  formData.append("file", blob, fileName);
  formData.append("model", "whisper-1");
  // COMMENT: allow only English for now
  formData.append("language", "en");

  // use fetch to upload
  try {
    const whisperResp = await fetch(
      "https://api.openai.com/v1/audio/transcriptions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`,
        },
        body: formData,
      }
    );

    // check errors
    if (!whisperResp.ok) {
      console.error("Failed to upload audio");
      return null;
    }

    const whisperJson = await whisperResp.json();

    return whisperJson.text;
  } catch (error) {
    console.error(error);
    return null;
  }
};

/**
 * Function to summarize the transcribed audio, using OpenAI model
 * @param {String} transcription audio that is to be summarized, should be a transcribed audios text
 * @returns String value of the summarized text
 */
export const summarizeAudioTranscription = async (transcription) => {
  const MASTER_PROMPT = `You will act as a helpful AI assistant, tasked with revising and enhancing provided text. Your expertise spans various fields and topics. Your primary role is to deliver concise, informative summaries of the provided text, ensuring thorough explanations. Approach topics with a beginner-friendly mindset, using analogies to clarify concepts. Additionally, include references where appropriate. Structure your responses with distinct sections, especially a dedicated area for analogies, to aid in understanding and grasping the material.`;
  try {
    const gptResponse = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [
            {
              // we should also consider having responses in MD format for bolding, highlighting, etc
              role: "system",
              content: MASTER_PROMPT,
            },
            {
              role: "user",
              content: transcription,
            },
          ],
          // choices: 3, // number of responses to generate; incurs more cost but can be used for further analysis
          temperature: 0.3, // lower the value the more focused and deterministic the response is
        }),
      }
    );

    if (!gptResponse.ok) {
      console.error("Failed to summarize transcription");
      return null;
    }

    const gptJson = await gptResponse.json();
    console.log("gpt json: ", gptJson);
    return gptJson.choices[0].message.content;
  } catch (error) {
    console.error(error);
    return null;
  }
};

export const summarizedTextToMarkdown = async (summarizedText) => {
  // const MASTER_PROMPT = `You, as a knowledgeable system in Markdown, will be given summarized text on various topics. Using your expertise, reformat this text to add structure and clarity. Apply headers and subheaders for organization, use text formatting like bold or italic for emphasis, and incorporate lists for easy readability. Where appropriate, use block quotes for emphasis, code blocks for technical snippets, horizontal rules for section separation, tables for structured data, and task lists for actionable items. Your goal is to transform the provided summaries into structured, Markdown-formatted documents that are clear and easy for students to follow.`;
  const MASTER_PROMPT = `As an expert in Markdown formatting, you are tasked with structuring and clarifying provided summaries on various topics. Utilize your knowledge to organize the content with appropriate headers and subheaders. Emphasize key points using bold or italic text. Incorporate lists, block quotes, code blocks, horizontal rules, tables, and task lists to enhance readability and comprehension. Additionally, apply text highlighting to key topics by wrapping them in <span style="background: yellow">TEXT VALUE</span> elements where it seems most effective, but avoid overuse to maintain focus on essential points. Your objective is to transform these summaries into well-organized, Markdown-formatted documents that are engaging and easy to understand for students.`;

  try {
    const gptResponse = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [
            {
              // we should also consider having responses in MD format for bolding, highlighting, etc
              role: "system",
              content: MASTER_PROMPT,
            },
            {
              role: "user",
              content: summarizedText,
            },
          ],
          // choices: 3, // number of responses to generate; incurs more cost but can be used for further analysis
          temperature: 0.3, // lower the value the more focused and deterministic the response is
        }),
      }
    );

    if (!gptResponse.ok) {
      console.error("Failed to markdown the summarized text");
      return null;
    }

    const gptJson = await gptResponse.json();
    console.log("gpt json: ", gptJson);
    return gptJson.choices[0].message.content;
  } catch (error) {
    console.error(error);
    return null;
  }
};

export const uploadFile = async (file) => {
  const storageRef = ref(storage, "uploads/" + file.name);

  if (!file) return;

  try {
    const fileRef = await uploadBytes(storageRef, file);
    console.log("File uploaded successfully:", fileRef);
    return fileRef;
  } catch (error) {
    console.error("Error uploading file:", error);
    return null;
  }
};

export const retrieveFileUrl = async (fileRef) => {
  // name of file ref to create a ref blob
  const fileName = fileRef.metadata.fullPath;

  const fileUrl = await getDownloadURL(ref(storage, fileName));
  return fileUrl;
};

// COMMENT: abstract such functionalities to other files so dont need db imports or storage imports
export const createCourseAudioRef = async (
  fileUrl,
  name,
  fileType,
  transcript,
  fileSize,
  duration,
  summarizedText,
  currentCourse,
  markdownText
) => {
  const audioRef = {
    url: fileUrl,
    name,
    type: fileType,
    size: fileSize || 0,
    duration: duration || 0,
    courseRef: currentCourse.id,
    createdAt: new Date(),
    transcript: transcript,
    summary: summarizedText,
    markdownText,
  };

  const courseAudioCollectionRef = collection(
    db,
    "Courses",
    `${currentCourse.id}`,
    "Audios"
  );
  await addDoc(courseAudioCollectionRef, audioRef);
};
