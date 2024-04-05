import { useContext, useRef, useEffect, useState } from 'react'
import '../../css/Transcripts/ImageTranscriber.css'
import { Context } from '../CoursesContext'

import { collection, addDoc } from "firebase/firestore";
import { db, storage } from "../../firebase-config";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

import { IoIosArrowDown } from "react-icons/io";

import { DetectDocumentTextCommand, TextractClient } from "@aws-sdk/client-textract";

import { Buffer } from "buffer";

export default function ImageComponent({ passUp }) {
    const { currentCourse } = useContext(Context)

    const fileInputRef = useRef()

    function handleButtonClick() {
        fileInputRef.current.click()
    }

    async function uploadFile(file) {
        const storageRef = ref(storage, "uploads/" + file.name)

        try {
            const fileRef = await uploadBytes(storageRef, file);
            console.log("File uploaded successfully:", fileRef);
            return fileRef;
        } catch (error) {
            console.error("Error uploading file:", error);
            return null;
        }
    }

    async function addItemToFirebase(imageRef) {
        const courseImageCollectionRef = collection(
            db,
            "Courses",
            `${currentCourse.id}`,
            "Images"
        )
        await addDoc(courseImageCollectionRef, imageRef)
    }

    const retrieveFileUrl = async (fileRef) => {
        // name of file ref to create a ref blob
        const fileName = fileRef.metadata.fullPath;
    
        const fileUrl = await getDownloadURL(ref(storage, fileName));
        return fileUrl;
    }

    async function AIImageTranscribe(file) {
        function toDataUrl(file) {
            const reader = new FileReader()
            return new Promise(resolve => {
            reader.onload = ev => {
                resolve(ev.target.result)
            }
            reader.readAsDataURL(file)
            })
        }

        const output = await toDataUrl(file)

        const client = new TextractClient({
            region: 'us-west-2',
            credentials: {
                accessKeyId: 'AKIA2OO6WUTY4QBBELEH',
                secretAccessKey: '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',
            },
        });
    
        // convert image to byte Uint8Array base 64
        const blob = Buffer.from(output.split(',')[1], 'base64');
    
        const params = {
            Document: {
                Bytes: blob,
            }
        };
    
        const command = new DetectDocumentTextCommand(params);
        try {
            const data = await client.send(command);
            // process data.
            if (data?.Blocks) {
                return data.Blocks
            }
        } catch (error) {
            console.log('err', error);
            // error handling.
        }
    } 

    async function handleFileChange(event) {
        const file = event.target.files[0]

        if (!file)  return

        const reference = await uploadFile(file)

        if (!reference) return

        const fileUrl = await retrieveFileUrl(reference)

        const transcription = await AIImageTranscribe(file)
        let sanitizedTranscription = ""

        transcription.forEach(block => {
            if (block.BlockType === 'LINE') {
                sanitizedTranscription = sanitizedTranscription + ` ${block.Text}`
            }
        })

        const storageObject = {
            courseRef: currentCourse.id,
            createdAt: new Date(),
            name: file.name,
            size: file.size || 0,
            transcription: sanitizedTranscription,
            type: file.type,
            url: fileUrl
        }

        addItemToFirebase(storageObject)
        passUp(fileUrl)
    }

    return (
        <div className="image-component-wrapper">
            <button className="image-component" onClick={handleButtonClick}>
                Upload Image
                <input
                    style={{display: 'none'}}
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    className=""
                    onChange={handleFileChange}
                />
                </button>
        </div>
    )
}
//image-data-wrapper-closed
export function ImageDropdown({ imgData }) {
    const [open, setOpen] = useState(false)
    const [hidden, setHidden] = useState(true)

    function passToModel(evt) {
        // handle button click, pass image transcription to model
    }

    useEffect(() => {
        if (open) {
            setTimeout(() => { setHidden(false) }, 100)
        }
    }, [open])

    return (
        <div className='image-dropdown-wrapper'>
            <div  className='image-wrapper'>
                <img className='dropdown-image' src={imgData.url} />
                {
                    (
                        open ?
                        <button onClick={passToModel} className='insights-button'>AI Insights</button> :
                        <></>
                    )
                }
            </div>
            <div className={`image-data-wrapper ${(!open ? 'image-data-wrapper-closed' : '')}`}>
                <div className='image-title-wrapper'>
                    <h3>{imgData.name}</h3>
                    <IoIosArrowDown onClick={ () => { setOpen(!open); setHidden(true); } } className={`image-toggle-icon ${(!open ? 'image-toggle-icon-closed' : '')}`} />
                </div>
                {
                    (
                        open ?
                        <div className='image-transcription-wrapper'>
                            <p className={(hidden ? 'hide-transcription' : '')}>{imgData.transcription}</p>
                        </div> :
                        <></>
                    )
                }
            </div>
        </div>
    )
}