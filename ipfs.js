import fs from 'fs' ;
var app = express();
import bodyParser from 'body-parser';
const port =8003;
import crypto from 'crypto';
import multer from 'multer';
import path from 'path';
import {dirname} from 'path';
import {fileURLToPath} from 'url';
import concat from 'concat-stream';
const _dirname = dirname(fileURLToPath(import.meta.url));
import pkg from 'uuid';
const { v4: uuidv4 } = pkg;
app. use (bodyParser. urlencoded({ extended: true }));
app.use(bodyParser-json({ limit: '1024mb' }));

import { create, globSource } from 'ipfs-http-client'



//API to store image data on ipfs
app.post ('/ addimageipfs',async (req, res) => {
try{
    const ipfs = create ('/ip4/127.0.0.1/tcp/9095');
    const bytesdata = req.body.imageData; // imageData should be in bytes64
    if(isBase64(bytesdata)){
        const imageBuffer = Buffer. from(bytesdata, 'base64');
        const result = await ipfs. add (imageBuffer);
    const cid = result. cid. toString();
    res.send(cid);
    }
    else{
        res.send ({"message": "please send image data in base64"});
    }
}catch (error){
    res.send ({"message": error});
    }
}) ;

//API to get Image from IPFS
app.post('/getimageipfs',async(req, res)=>{
    try{
    const ipfs = create('/1p4/127.0.0.1/tcp/9095');
    let cid = req.body.cid;
    const result =[];
    for await (const chunk of ipfs.cat(cid)){
        result. push(chunk);
    }
    const imageData = Buffer.concat(result);
    //convert data into base64 string
    const base64Data = imageData.toString( 'base64');
    res.send (base64Data);
 }catch(error) {
        res.send({"message": error});
    }   
});


//API to upload multiple  files to IPFS
const upload3 = multer({dest:'uploads/'});

app.post('/multiupload', upload3.array('files', 10), async (req, res) => {
    try{
        const ipfs = create('/ip4/127.0.0.1/tcp/9095'); // IPFS node connection
        let fileCIDs = [];
        if(req.files || req. files. length === 0){
            return res. status (400). json({error: "No files were uploaded. "})
        }
        // Loop through the uploaded files and add each to IPFS
        for (const file of req. files) {
        const fileData = fs. readFileSync(file.path);
        const fileAdded = await ipfs. add(fileData);
        console. log("File added to IPFS:", fileAdded);
        fileCIDs.push({fileName: file.originalname, cid: fileAdded.cid.toString()});
        }

        res. json({ cids: fileCIDs });
    }catch(error) {
        console.error(error);
        res.status(500).json({error: 'Internal server error' });
    }
});


//API to get pdf from IPFS

app.get ('/pdf/:cid', async (req, res) => {
    try {
    const ipfs = create('/ip4/127.0.0.1/tcp/9095');
    const cid = req.params.cid;
    // Fetch the file from IPFS by CID
    const response = await ipfs.cat(cid);
    const contentType = 'application/pdf';
    const contentBuffer =[];
    for await(const chunk of ipfs.cat(cid)){
        contentBuffer . push(chunk);
        const pdf = Buffer. concat(contentBuffer);
        res. setHeader ('Content-Type', 'application/pdf'); 
        res. send (pdf);
    }
    }catch(error) {
    console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
    
//API to get video content from IPFS
app.get('/getVideo',async(req,res)=>{
    try{
        const cid = req.query.cid;
        const ipfs = create('/ip4/127.0.0.1/tcp/9095');
        const response= ipfs.cat(cid);
        let videoBuffer =[];
        for await(const chunk of response){
            videoBuffer.push(chunk);
        }
        //concatenate all chunks of video into single buffer
        const videoData =Buffer.concat(videoBuffer);
        const videoPath =path.join(__dirname,'videos',`${cid}.mp4`);
        //if videos directory not exists then create 
        if(!fs.existsSync(path.join(__dirname,'videos'))){
            fs.mkdirSync(path.join(__dirname,'videos'));
        }
        //save video in specified path
        fs.writeFileSync(videoPath,videoData);
        const stat= fs.startSync(videoPath);
        const fileSize =stat.size;
        const range =req.headers.range;
        const head ={
            'Content-Length':fileSize,
            'Content-Type':'video/mp4',
        };
        res.writeHead(200,head);
        //stream the video
        const videoStream = fs.createReadStream(videoPath);
        videoStream.pipe(res);
        videoStream.on('error',(streamError)=>{
            res.status(500).json({error:'Error streaming video'});
        });
    }catch(error){
        res.status(500).json({error});
    }
});

app.listen(port,()>{
    console.log(`Microservices listening at:${port}`);
});