import { workerData, parentPort } from 'worker_threads';
import ytdl from "ytdl-core";
import fs from 'fs'

const { url, startTime, endTime, index } = workerData;
const info = await ytdl.getInfo(url)
const format = ytdl.chooseFormat(info.formats, { quality: 'highest' })

console.log(format.averageBitrate)

const range = {
    start: Math.floor(startTime * format.averageBitrate / 8),
    end: Math.floor(endTime * format.averageBitrate / 8),
};
// console.log({ range })

ytdl(url, {
    range,
}).pipe(fs.createWriteStream(`output${index}.mp4`))
    .on('finish', () => {
        console.log('Segment downloaded successfully!');
    })
    .on('error', (error) => {
        console.error('Error occurred during segment download:', error);
    });

parentPort.postMessage({ message: `output${index}.mp4 downloaded successfully` })
