import ytdl from "ytdl-core";
import os from 'os'
import { Worker, workerData } from "worker_threads";
import { error } from "console";

const videoUrl = 'https://youtu.be/0Wk5DAb2Jb8'
const videoUrl2 = 'https://youtu.be/JrBorYO7q2Q'

function getLen(vidLen, segCount) {
    let quotient = Math.floor(vidLen / segCount)
    let remainder = vidLen - (quotient * segCount)
    let ans = remainder !== 0 ? [quotient, remainder] : [quotient]
    return ans
}

const timeRange = (videoLen, segmentLen) => {
    let time = []
    if (segmentLen.length === 2) {
        for (let i = 0; i <= videoLen; i += segmentLen[0]) {
            time.push(i)
        }
        time.push(time[time.length - 1] + segmentLen[1])
    } else {
        for (let i = 0; i < videoLen; i += segmentLen[0]) {
            time.push(i)
        }
    }
    return time
}

const createDLWorker = (startTime, endTime, index, vidURL) => {
    return new Promise((resolve, reject) => {
        const workerDL = new Worker('./workerDL.js', { workerData: { url: vidURL, startTime: startTime, endTime: endTime, index: index } })
        workerDL.on("message", (data) => {
            resolve(data)
        })
        workerDL.postMessage("error", (error) => {
            reject(`an error occured ${error}`)
        })
    })
}

const dlWorkers = (vidLen, segmentCount, time, vidURL) => {
    let workerPromises = []
    if (vidLen % segmentCount === 0) {
        for (let i = 1; i < segmentCount; i++) {
            workerPromises.push(createDLWorker(time[i - 1], time[i], i, vidURL))
        }
    } else {
        for (let i = 0; i <= segmentCount; i++) {
            workerPromises.push(createDLWorker(time[i], time[i + 1], i, vidURL))
        }
    }
    return workerPromises
}

const videofunc = async () => {
    let videoInfo = await ytdl.getInfo(videoUrl)
    console.log(videoUrl)
    let videoLen = videoInfo.videoDetails.lengthSeconds
    let coreCount = os.cpus().length
    let segmentCount = coreCount - 1
    let segmentLen = getLen(videoLen, segmentCount)
    console.log(segmentLen)
    let time = timeRange(videoLen, segmentLen)
    console.log(time)
    let workerPromises = dlWorkers(videoLen, segmentCount, time, videoUrl)

    const threadResults = await Promise.all(workerPromises)
    console.log(threadResults)

}

videofunc()