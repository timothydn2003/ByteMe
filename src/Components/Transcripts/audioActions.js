import { collection, addDoc } from "firebase/firestore";
import { db } from "../../firebase-config";
import { storage } from "../../firebase-config";

import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

import { GoogleGenerativeAI } from "@google/generative-ai";

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
// export const summarizeAudioTranscription = async (transcription) => { COMMENT: OG model
export const summarizeAudioToSummarizedTextGPT = async (transcription) => {
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

export const summarizedAudioToSummarizedTextGemini = async (
  summarizedAudio
) => {
  const MASTER_PROMPT = `You will act as a helpful AI assistant, tasked with revising and enhancing provided text. Your expertise spans various fields and topics. Your primary role is to deliver concise, informative summaries of the provided text, ensuring thorough explanations. Approach topics with a beginner-friendly mindset, using analogies to clarify concepts. Additionally, include references where appropriate. Structure your responses with distinct sections, especially a dedicated area for analogies, to aid in understanding and grasping the material.`;

  try {
    const prompt = `${MASTER_PROMPT}\n\n${summarizedAudio}`;

    // const geminiResponse = await fetch(
    //   // `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateText?key=${process.env.REACT_APP_GEMINI_KEY}`,
    //   `https://generativelanguage.googleapis.com/v1beta/{model=models/*}:generateText?key=${process.env.REACT_APP_GEMINI_KEY}`,
    //   {
    //     method: "POST",
    //     headers: {
    //       "Content-Type": "application/json",
    //     },
    //     body: JSON.stringify({
    //       "contents": [
    //         {
    //           "parts": {
    //             "text": prompt,
    //           },
    //         },
    //       ],
    //       "safetyRatings": [
    //         {
    //           "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT",
    //           "probability": "NEGLIGIBLE",
    //         },
    //         {
    //           "category": "HARM_CATEGORY_HATE_SPEECH",
    //           "probability": "NEGLIGIBLE",
    //         },
    //         {
    //           "category": "HARM_CATEGORY_HARASSMENT",
    //           "probability": "NEGLIGIBLE",
    //         },
    //         {
    //           "category": "HARM_CATEGORY_DANGEROUS_CONTENT",
    //           "probability": "NEGLIGIBLE",
    //         },
    //       ],
    //     }),
    //   }
    // );

    // const genAI = new GoogleGenerativeAI({
    //   apiKey: process.env.REACT_APP_GEMINI_KEY,
    // });

    const API_KEY = process.env.REACT_APP_GEMINI_KEY;

    const genAI = new GoogleGenerativeAI(API_KEY);

    const GeminiModel = genAI.getGenerativeModel({
      // for text-only input, use gemini pro model
      // model: "gemini-pro",
      model: "gemini-1.0-pro",
      // if need multi modal; text-and-image input use the pro-vision model "gemini-pro-vision"
    });
    const result = await GeminiModel.generateContent(prompt);

    console.log("gemini result: ", result);
    console.log(result.response.candidates[0].content.parts[0].text);

    return result.response.candidates[0].content.parts[0].text;

    // if (!geminiResponse.ok) {
    //   console.error("Failed to summarize transcription (gemini)");
    //   return null;
    // }

    // const geminiJson = await geminiResponse.json();
    // console.log("gemini json: ", geminiJson);
    // return geminiJson.contents[0].parts.text;
  } catch (error) {
    console.error(error);
    return null;
  }
};

// export const reconciseModelsSummarization = async (
//   summarizedTextOne,
//   summarizedTextTwo
// ) => {
export const summarizeAudioTranscription = async (transcription) => {
  // const MASTER_PROMPT = `You will act as a helpful AI assistant, tasked with revising and enhancing provided text. Your expertise spans various fields and topics. Your primary role is to deliver concise, informative summaries of the provided text, ensuring thorough explanations. Approach topics with a beginner-friendly mindset, using analogies to clarify concepts. Additionally, include references where appropriate. Structure your responses with distinct sections, especially a dedicated area for analogies, to aid in understanding and grasping the material.`;
  const MASTER_PROMPT = `You are to function as an AI assistant with extensive knowledge in various domains, focusing on revising and enhancing text derived from multiple AI models. Your task is to create detailed, note-like summaries that are comprehensive yet clear and accessible. While the summaries may be lengthy, akin to thorough notes on the provided text, they should not be overly complex. Address the content with a beginner-friendly approach, employing analogies for easier comprehension, and emphasizing key concepts without losing the essence of the material. Structure your responses to aid understanding, keeping them well-organized and informative. Maintain the core messages from the initial AI-generated summaries, ensuring clarity and depth. Include any provided links or references, as they are vital for further exploration. Aim your summaries slightly towards students, while still being suitable for a general audience, to offer clear, detailed insights into the topics, thus preserving and amplifying the significance of the original texts.`;
  try {
    const summarizedTextOne = await summarizeAudioToSummarizedTextGPT(
      transcription
    );
    const summarizedTextTwo = await summarizedAudioToSummarizedTextGemini(
      transcription
    );

    // summarize the 2 summarized texts
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
              content: summarizedTextOne,
            },
            {
              role: "user",
              content: summarizedTextTwo,
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
  // const MASTER_PROMPT = `As an expert in Markdown formatting, you are tasked with structuring and clarifying provided summaries on various topics. Utilize your knowledge to organize the content with appropriate headers and subheaders. Emphasize key points using bold or italic text. Incorporate lists, block quotes, code blocks, horizontal rules, tables, and task lists to enhance readability and comprehension. Additionally, apply text highlighting to key topics by wrapping them in <span style="background: yellow">TEXT VALUE</span> elements where it seems most effective, but avoid overuse to maintain focus on essential points. Your objective is to transform these summaries into well-organized, Markdown-formatted documents that are engaging and easy to understand for students.`;
  const MASTER_PROMPT = `As a Markdown formatting specialist, your responsibility is to skilfully organize and clarify summaries on a variety of subjects, making them easily digestible for students. Start every summary with an engaging introduction that sets the stage by outlining the central theme. Use Markdown's formatting capabilities to draw focus to the main points, employing bold or italic styles for emphasis. Create a well-structured narrative by organizing the content with clear headers and subheaders. Integrate Markdown features such as lists, block quotes, code blocks, horizontal rules, tables, and task lists judiciously to enhance both readability and comprehension. As you near the end of each summary, weave in simple yet effective analogies that are relevant to the topic. These should be everyday examples that illuminate complex ideas, making them more tangible and understandable for students. Ensure to include any provided references as a reliable resource for further exploration. Enhance the summaries with text highlighting by using <span style="background: yellow">TEXT VALUE</span> for essential topics, creating a visual distinction without detracting from the overall content. Your ultimate aim is to transform these summaries into meticulously formatted Markdown documents. These should not only be rich in information but also engaging, clear, and specifically tailored to foster an intuitive learning experience for students.`;

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
  markdownText,
  keyTopics
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
    keyTopics,
  };

  const courseAudioCollectionRef = collection(
    db,
    "Courses",
    `${currentCourse.id}`,
    "Audios"
  );
  await addDoc(courseAudioCollectionRef, audioRef);
};

export const generateKeyTopics = async (transcript) => {
  // call API to generate key topics
  // const MASTER_PROMPT = `Your task is to analyze and extract the key topics from a given set of summarized texts. Carefully read through each summary, identifying and highlighting the most significant themes, concepts, and ideas. Focus on pinpointing the core elements that encapsulate the essence of the text. After reviewing the summaries, list the key topics in a clear and organized manner. This list should represent a distilled version of the summarized text, capturing its most crucial and central points. Be sure to differentiate between primary and secondary topics, prioritizing them based on their relevance and significance within the text. Your goal is to provide a concise yet comprehensive overview of the main topics, offering a clear insight into the text's core subject matter.`
  const MASTER_PROMPT = `Your task now is to delve into the summarized text provided and extract not just key words, but an array of five distinct elements that best encapsulate the text's main themes or ideas. These elements could be crucial words, pivotal phrases, or significant concepts. Scrutinize the content to isolate these elements, ensuring they collectively provide a comprehensive representation of the text's core message. Organize them into a structured array format, with each element holding its own place in the list. This array should serve as a condensed yet complete overview of the text's most critical points, offering a brief but insightful glimpse into the overarching themes or subjects discussed. Aim for a balanced selection that together forms a coherent summary of the text's essence, condensed into five essential elements.`;
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
              role: "system",
              content: MASTER_PROMPT,
            },
            {
              role: "user",
              content: transcript,
            },
          ],
        }),
      }
    );
    if (!gptResponse.ok) {
      console.error("Failed to generate key topics");
      return null;
    }

    const gptJson = await gptResponse.json();
    console.log("gpt json keytopics: ", gptJson);
    console.log("content msg: ", gptJson.choices[0].message.content);
    return gptJson.choices[0].message.content;
  } catch (error) {
    console.error(error);
    return null;
  }
  // return the key topics
};
