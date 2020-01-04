import numpy as np
import cv2
import imutils
import socketio
import time
import base64
from crop import region_of_interest
from pyimagesearch.centroidtracker import CentroidTracker


cap = cv2.VideoCapture('video3.mp4')
minarea = 1800
maxarea = 200000
lineup = 60
linedow = 50
count = 0
sub = cv2.createBackgroundSubtractorKNN()
ct = CentroidTracker()
while (1):
	ret, frame = cap.read()
	#image = cv2.resize(frame, (0, 0), None, 0.5, 0.5)
	image = imutils.resize(frame,width=350)
	region_of_interest_vertices = ([20,250],[130,50],[210,50],[390,290])
	cropped_image = region_of_interest(image,np.array([region_of_interest_vertices], np.int32),)
	gray = cv2.cvtColor(cropped_image, cv2.COLOR_BGR2GRAY)
	fgmask = sub.apply(gray)
	kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
	closing = cv2.morphologyEx(fgmask, cv2.MORPH_CLOSE, kernel)
	opening = cv2.morphologyEx(closing, cv2.MORPH_OPEN, kernel)
	dilation = cv2.dilate(opening, kernel)
	retvalbin, bins = cv2.threshold(dilation, 120, 255, cv2.THRESH_BINARY)
	contours, hierarchy= cv2.findContours(bins, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)

	cv2.line(image, (60, 150), (280, 150), (0, 0, 255), 5)

	rects = []
	
	for i in range(len(contours)):
		if hierarchy[0, i, 3] == -1:# lay vong lon nhat

			area = cv2.contourArea(contours[i])
			if minarea < area < maxarea:
				cnt = contours[i]
				M = cv2.moments(cnt) # tim tam cua contours
				cx = int(M['m10'] / M['m00'])
				cy = int(M['m01'] / M['m00'])
				if cy > linedow:
					x, y, w, h = cv2.boundingRect(cnt)
					box = np.array([x, x+w , y, y+h])
				#cv2.drawContours(image,cnt, -1, (0, 255, 0), 2)
				rects.append(box.astype("int"))
				cv2.line(image, (60, 150), (280, 150), (0, 255, 0), 5)
				cv2.rectangle(image, (x,y), (x+w,y+h), (255, 0, 0), 2)
				cv2.circle(image, (cx, cy), 3, (0, 0, 255), -1)
				#cv2.putText(image, "center", (cx - 20, cy - 20),cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 2)
	#print(rects)
	objects = ct.update(rects)
	for (objectID, centroid) in objects.items(): #set id
		
		text = "XE {}".format(objectID)
		#print(objectID)
		count = objectID
		cv2.putText(image, text, (centroid[0] - 20, centroid[1] - 20),cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)
		cv2.circle(image, (centroid[0], centroid[1]), 4, (0, 255, 0), -1)
		
	cv2.putText(image, "SO XE: " + str(count), (20, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.6,(0, 0, 255), 2)
	cv2.imshow("Image", image)
	cv2.imshow("Image1", cropped_image)
	#cv2.imshow("Image2", image)
	if cv2.waitKey(1) == 27:
		break

cap.release()
cv2.destroyAllWindows()
