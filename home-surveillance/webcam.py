import socketio
import base64
import cv2
import numpy as np
from imutils.video import VideoStream
import imutils
import datetime
import time

vs = VideoStream(0).start()
sio = socketio.Client()
frameSize = 300
flagStream = False


@sio.event(namespace='/VideoStream')
def connect():
    print('[INFO] Connection Established')
    print("[INFO] warming up...")
    time.sleep(2.5)
    avg = None
    lastUploaded = datetime.datetime.now()
    motionCounter = 0
    while(True):
        frame = vs.read()
        timestamp = datetime.datetime.now()
        text = "Unoccupied"
        frame = imutils.resize(frame, frameSize)
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        gray = cv2.GaussianBlur(gray, (21, 21), 0)

        # if the average frame is None, initialize it
        if avg is None:
            print("[INFO] starting background model...")
            avg = gray.copy().astype("float")
            continue

        cv2.accumulateWeighted(gray, avg, 0.5)
        frameDelta = cv2.absdiff(gray, cv2.convertScaleAbs(avg))

        thresh = cv2.threshold(frameDelta, 5, 255, cv2.THRESH_BINARY)[1]
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
            cv2.rectangle(frame, (x, y), (x + w, y + h), (0, 255, 0), 2)
            text = "Occupied"

        # draw the text and timestamp on the frame
        ts = timestamp.strftime("%A %d %B %Y %I:%M:%S%p")
        cv2.putText(frame, "Room Status: {}".format(text), (10, 20), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 2)
        cv2.putText(
            frame, ts, (10, frame.shape[0] - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.35, (0, 0, 255), 1)

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

        _, dataImg = cv2.imencode('.jpg', frame)
        if flagStream:
            sio.emit('stream', str(base64.b64encode(dataImg), 'utf-8'), namespace='/VideoStream')
        if cv2.waitKey(100) == 27:
            break
    vs.stop()

@sio.on('frameSize', namespace='/VideoStream')
def on_message(value):
    global frameSize
    frameSize = int(value)

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
