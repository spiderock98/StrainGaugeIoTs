import numpy as np
import cv2
import pandas as pd
import imutils
import socketio
import time
import base64
from crop import region_of_interest

sio = socketio.Client()
flagStream = False
uniqueCameraID = 'stream'
uniqueSensorID = 'sensor3' # to query database
authAccess = None

@sio.event(namespace='/VideoStream')
def connect():
    print('[INFO] Connection Established')
    while (authAccess != 'GRANTED'):
        queryCamID = input('Enter ID: ')
        password = input('Enter Password: ')
        sio.emit('auth', (queryCamID, password, uniqueSensorID), namespace='/VideoStream')
        time.sleep(2)
        if (authAccess == 'DENIED'):
            print('[INFO] Try Again ...')
        continue
    print('[INFO] Access Granted')

    # cap = cv2.VideoCapture('counter_car/road-short.mp4')
    cap = cv2.VideoCapture('counter_car/road.mp4')
    frames_count, fps, width, height = cap.get(cv2.CAP_PROP_FRAME_COUNT), cap.get(cv2.CAP_PROP_FPS), cap.get(cv2.CAP_PROP_FRAME_WIDTH), cap.get(cv2.CAP_PROP_FRAME_HEIGHT)
    width = int(width)
    height = int(height)

    df = pd.DataFrame(index=range(int(frames_count)))
    df.index.name = "Frames"


    carids = [] 
    caridscrossed = []
    lineypos = 110
    lineypos2 = 120
    # lineypos = 235
    # lineypos2 = 255
    minarea = 500
    maxarea = 15000
    #sub = cv2.createBackgroundSubtractorMOG2()  # tao backgound tru nen- phat hien vat chuyen dong
    sub = cv2.createBackgroundSubtractorKNN()
    framenumber = 0 
    carscrossedup = 0 
    carscrosseddown = 0

    while (1):
        _, frame = cap.read()
        # image = cv2.resize(frame, (0, 0), None, 0.5, 0.5)
        image = imutils.resize(frame, 350)
        region_of_interest_vertices = ([16,138],[90,45],[155,45],[240,138])
        cropped_image = region_of_interest(image,np.array([region_of_interest_vertices], np.int32),)
        gray = cv2.cvtColor(cropped_image, cv2.COLOR_BGR2GRAY)
        fgmask = sub.apply(gray)
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
        closing = cv2.morphologyEx(fgmask, cv2.MORPH_CLOSE, kernel)
        opening = cv2.morphologyEx(closing, cv2.MORPH_OPEN, kernel)
        dilation = cv2.dilate(opening, kernel)
        retvalbin, bins = cv2.threshold(dilation, 230, 255, cv2.THRESH_BINARY)
        contours, hierarchy= cv2.findContours(bins, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
        cv2.line(image, (30, lineypos), (220, lineypos), (0, 0, 255), 1)
        cv2.line(image, (30, lineypos2), (220, lineypos2), (255, 0, 0), 1)

        cxx = np.zeros(len(contours))
        cyy = np.zeros(len(contours))

        for i in range(len(contours)):
            if hierarchy[0, i, 3] == -1:# lay vong lon nhat

                area = cv2.contourArea(contours[i]) 
                if minarea < area < maxarea:
                    cnt = contours[i]
                    M = cv2.moments(cnt) # tim tam cua contours
                    cx = int(M['m10'] / M['m00'])
                    cy = int(M['m01'] / M['m00'])
                    if cy > lineypos:
                        x, y, w, h = cv2.boundingRect(cnt)
                        cxx[i] = cx
                        cyy[i] = cy
        cxx = cxx[cxx != 0]
        cyy = cyy[cyy != 0]
        minx_index2 = []
        miny_index2 = []
        maxrad = 25
        if len(cxx):
            if not carids:
                for i in range(len(cxx)):
                    carids.append(i)
                    df[str(carids[i])] = ""
                    df.at[int(framenumber), str(carids[i])] = [cxx[i], cyy[i]]
                    totalcars = carids[i] + 1
            else:
                dx = np.zeros((len(cxx), len(carids)))
                dy = np.zeros((len(cyy), len(carids)))
                for i in range(len(cxx)):
                    for j in range(len(carids)):
                        oldcxcy = df.iloc[int(framenumber - 1)][str(carids[j])]
                        curcxcy = np.array([cxx[i], cyy[i]])
                        if not oldcxcy:
                            continue
                        else:
                            dx[i, j] = oldcxcy[0] - curcxcy[0]
                            dy[i, j] = oldcxcy[1] - curcxcy[1]

                for j in range(len(carids)):
                    sumsum = np.abs(dx[:, j]) + np.abs(dy[:, j])
                    correctindextrue = np.argmin(np.abs(sumsum))
                    minx_index = correctindextrue
                    miny_index = correctindextrue
                    mindx = dx[minx_index, j]
                    mindy = dy[miny_index, j]
                    if mindx == 0 and mindy == 0 and np.all(dx[:, j] == 0) and np.all(dy[:, j] == 0):
                        continue
                    else:
                        if np.abs(mindx) < maxrad and np.abs(mindy) < maxrad:
                            df.at[int(framenumber), str(carids[j])] = [cxx[minx_index], cyy[miny_index]]
                            minx_index2.append(minx_index)
                            miny_index2.append(miny_index)
                for i in range(len(cxx)):
                    if i not in minx_index2 and miny_index2:
                        df[str(totalcars)] = ""
                        totalcars = totalcars + 1
                        t = totalcars - 1
                        carids.append(t)
                        df.at[int(framenumber), str(t)] = [cxx[i], cyy[i]]
                    elif curcxcy[0] and not oldcxcy and not minx_index2 and not miny_index2:
                        df[str(totalcars)] = ""
                        totalcars = totalcars + 1
                        t = totalcars - 1
                        carids.append(t)
                        df.at[int(framenumber), str(t)] = [cxx[i], cyy[i]]
        currentcars = 0
        currentcarsindex = []
        for i in range(len(carids)):
            if df.at[int(framenumber), str(carids[i])] != '':
                currentcars = currentcars + 1
                currentcarsindex.append(i)
        for i in range(currentcars):
            curcent = df.iloc[int(framenumber)][str(carids[currentcarsindex[i]])]
            oldcent = df.iloc[int(framenumber - 1)][str(carids[currentcarsindex[i]])]
            if curcent:
                if oldcent:
                    xstart = oldcent[0] - maxrad
                    ystart = oldcent[1] - maxrad
                    xwidth = oldcent[0] + maxrad
                    yheight = oldcent[1] + maxrad
                    if oldcent[1] >= lineypos2 and curcent[1] <= lineypos2 and carids[currentcarsindex[i]] not in caridscrossed:
                        carscrossedup = carscrossedup + 1
                        cv2.line(image, (0, lineypos2), (width, lineypos2), (0, 255, 0), 1)
                        caridscrossed.append(currentcarsindex[i]) 
                    elif oldcent[1] <= lineypos2 and curcent[1] >= lineypos2 and carids[currentcarsindex[i]] not in caridscrossed:
                        carscrosseddown = carscrosseddown + 1
                        cv2.line(image, (100, lineypos2), (530, lineypos2), (0, 255, 0), 1)
                        caridscrossed.append(currentcarsindex[i])
        cv2.putText(image, "SO XE: " + str(carscrosseddown), (20, 50), cv2.FONT_HERSHEY_SIMPLEX, 0.5,(0, 0, 255), 1)
        #cv2.imshow("image", image)
        #cv2.imshow("cropped_image", cropped_image)
        framenumber = framenumber + 1
        
        _,dataImg = cv2.imencode('.jpg', image)
        if flagStream:
            sio.emit('stream', (str(base64.b64encode(dataImg), 'utf-8')), namespace='/VideoStream')

        # time.sleep(0.1)
    # cap.release()
    # cv2.destroyAllWindows()

@sio.on('auth', namespace='/VideoStream')
def on_message(val):
    global authAccess
    authAccess = val

@sio.on('crosslock', namespace='/VideoStream')
def on_message(dictCross):
    global flagStream
    print(dictCross)
    if (dictCross[uniqueCameraID] == 'on'):
        flagStream = True
    else:
        flagStream = False

@sio.on('onunload', namespace='/VideoStream')
def on_message():
    global flagStream
    flagStream = False

@sio.event
def disconnect():
    print('[INFO] Disconnected from server')

# sio.connect('https://stream-opencv.herokuapp.com')
sio.connect('http://localhost:8080/', namespaces=['/VideoStream'])
# sio.connect('http://27.78.42.155:8080/', namespaces=['/VideoStream'])
sio.wait()
