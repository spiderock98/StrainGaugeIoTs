# import requests

# url = '192.168.1.3:8080/'
# res = requests.post(url, data={'value': 1234})
# print(res)

import socketio
import json
import base64 
import cv2
import numpy as np
from imutils.video import VideoStream
import imutils

vs = VideoStream(0).start()
sio = socketio.Client()
frameSize = 100

@sio.event(namespace='/VideoStream')
def connect():
    print('connection established')
    while(1):
        frame = vs.read()
        #cv2.imshow('frame', frame)
        frame = imutils.resize(frame, frameSize)
        _,dataImg = cv2.imencode('.jpg', frame)
        # encoded_byte = base64.b64encode(dataImg)
        sio.emit('stream', str(base64.b64encode(dataImg), 'utf-8'), namespace='/VideoStream')
        if cv2.waitKey(50) == 27:
            break
    vs.stop()
    #cv2.destroyAllWindows()

# @sio.event
# def onEvent(data):
#     print(data)

@sio.on('frameSize', namespace='/VideoStream')
def on_message(value):
    global frameSize
    frameSize = int(value)

#### Send image on local to server ####
    # data = {}
    # with open('iron.jpg', mode='rb') as file:
    #     img = file.read()
    # data['img'] = base64.encodebytes(img).decode("utf-8")
    # print(type(data))
    # sio.emit('repEvent', json.dumps(data))


@sio.event
def disconnect():
    print('disconnected from server')

# sio.connect('https://stream-opencv.herokuapp.com')
# sio.connect('http://localhost:8080/', namespaces=['/VideoStream'])
sio.connect('http://52.230.11.106:8080/', namespaces=['/VideoStream'])
sio.wait()
