import socketio
import base64
import cv2
import numpy as np
# from imutils.video import VideoStream
import imutils
import datetime
import time
from threading import Thread


class WebcamVideoStream:
    def __init__(self, src=0, name="WebcamVideoStream"):
        # initialize the video camera stream and read the first frame from the stream
        self.stream = cv2.VideoCapture(src)
        _, self.frame = self.stream.read()
        # self.frame = imutils.resize(self.frame, 400)

        # initialize the thread name
        self.name = name

        # initialize the variable used to indicate if the thread should be stopped
        self.stopped = False

    def start(self):
        # start the thread to read frames from the video stream
        t = Thread(target=self.update, name=self.name, args=())
        t.daemon = True
        t.start()
        # t.join()
        return self

    def update(self):
        print('[INFO] Connection Established')
        print("[INFO] warming up...")
        time.sleep(2.5)
        avg = None
        lastUploaded = datetime.datetime.now()
        motionCounter = 0
        # keep looping infinitely until the thread is stopped
        while True:
            # print('parallel thread')
            # if the thread indicator variable is set, stop the thread
            if self.stopped:
                return
            # otherwise, read the next frame from the stream
            _, self.frameInit = self.stream.read()

            timestamp = datetime.datetime.now()
            text = "Unoccupied"
            self.frame = imutils.resize(self.frameInit, 300)
            gray = cv2.cvtColor(self.frame, cv2.COLOR_BGR2GRAY)
            gray = cv2.GaussianBlur(gray, (21, 21), 0)

            # if the average frame is None, initialize it
            if avg is None:
                print("[INFO] starting background model...")
                avg = gray.copy().astype("float")
                continue

            cv2.accumulateWeighted(gray, avg, 0.5)
            frameDelta = cv2.absdiff(gray, cv2.convertScaleAbs(avg))

            thresh = cv2.threshold(
                frameDelta, 5, 255, cv2.THRESH_BINARY)[1]
            thresh = cv2.dilate(thresh, None, iterations=2)
            cnts = cv2.findContours(
                thresh.copy(), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            cnts = imutils.grab_contours(cnts)

            for c in cnts:
                # if the contour is too small, ignore it
                if cv2.contourArea(c) < 5000:
                    continue
                # compute the bounding box for the contour, draw it on the frame,
                # and update the text
                (x, y, w, h) = cv2.boundingRect(c)
                cv2.rectangle(self.frame, (x, y), (x + w, y + h),
                              (0, 255, 0), 2)
                text = "Occupied"

            # draw the text and timestamp on the frame
            ts = timestamp.strftime("%A %d %B %Y %I:%M:%S%p")
            cv2.putText(self.frame, "Room Status: {}".format(text), (10, 20),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 2)
            cv2.putText(
                self.frame, ts, (10, self.frame.shape[0] - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.35, (0, 0, 255), 1)

            # check to see if the room is occupied
            if text == "Occupied":
                # check to see if enough time has passed between uploads
                if (timestamp - lastUploaded).seconds >= 3:
                    # increment the motion counter
                    motionCounter += 1
                    if motionCounter >= 8:
                        lastUploaded = timestamp
                        motionCounter = 0
            else:
                motionCounter = 0

            # if cv2.waitKey(10) == 27:
            #     break

    def read(self):
        # return the frame most recently read
        return self.frame

    def stop(self):
        # indicate that the thread should be stopped
        self.stopped = True


###### MAIN THREAD ######

vs = WebcamVideoStream(0).start()
sio = socketio.Client()
# frameSize = 300
flagStream = False
dataImg = 0

@sio.event(namespace='/VideoStream')
def connect():
    while(True):
        _, dataImg = cv2.imencode('.jpg', vs.read())
        if flagStream:
            sio.emit('stream', str(base64.b64encode(dataImg), 'utf-8'), namespace='/VideoStream')
        print('main thread')
        cv2.imread('frame', vs.frame)
        if cv2.waitKey(1000) == 27:
            break
    vs.stop()


# @sio.on('frameSize', namespace='/VideoStream')
# def on_message(value):
#     global frameSize
#     frameSize = int(value)


@sio.on('onload', namespace='/VideoStream')
def on_message():
    global flagStream
    flagStream = True


@sio.on('onunload', namespace='/VideoStream')
def on_message():
    global flagStream
    flagStream = False


@sio.event(namespace='/VideoStream')
def disconnect():
    print('[INFO] Disconnected from server')


# sio.connect('http://localhost:8080/', namespaces=['/VideoStream'])
sio.connect('http://27.78.42.155:8080/', namespaces=['/VideoStream'])
# sio.connect('https://spiderock.azurewebsites.net:80/', namespaces=['/VideoStream'])
sio.wait()
