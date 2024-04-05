import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Modal from '@mui/material/Modal';
import { useEffect, useState } from 'react'
import axios from 'axios';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
const style = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 400,
    bgcolor: 'background.paper',
    border: '2px solid #000',
    boxShadow: 24,
    p: 4,
  };
export const YoutubeConverter = () => {
    const [link, setLink] = useState("")
    const [show, setShow] = useState(false)
    const [download, setDownload] = useState("")

    const [open, setOpen] = useState(false);
    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);

    const getVideo = async () => {
        const options = {
            method: 'GET',
            url: 'https://youtube-mp3-downloader2.p.rapidapi.com/ytmp3/ytmp3/',
            params: {
              url: link
            },
            headers: {
              'X-RapidAPI-Key': '753fe216d0msh58435e99dde1dfdp13dd38jsncbb34d83b22b',
              'X-RapidAPI-Host': 'youtube-mp3-downloader2.p.rapidapi.com'
            }
          };
      
      try {
        setShow(true)
        const response = await axios.request(options);
        setDownload(response.data.link)
        setShow(false)
        handleClose()
      } catch (error) {
        console.error(error);
      }
    }

    useEffect(() => {
        if (download) {
          window.location.href = download;
        }
      }, [download]);
    return(
        <div className='youtube-link-converter'>
            <Button style={{marginTop: "20px"}} variant="contained" onClick={handleOpen}>Upload Youtube</Button>
            <Modal
                open={open}
                onClose={handleClose}
                aria-labelledby="modal-modal-title"
                aria-describedby="modal-modal-description"
            >
            <Box sx={style}>
                {show? 
                    <div style={{justifyContent: 'center', textAlign: "center"}}>
                        <CircularProgress />
                        <h3>Converting...</h3>
                    </div>:
                <div> <h3>Convert YouTube Link to MP3</h3>
                <TextField id="outlined-basic" label="Add Youtube Link" variant="outlined" onChange={(e) => setLink(e.target.value)}/><br></br>
                <Button style={{marginTop: "10px"}} variant="contained" onClick={getVideo}>Convert</Button></div>
                }
            </Box>
          </Modal>
        </div>
    )
}