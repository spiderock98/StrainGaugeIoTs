# -*- coding: utf-8 -*-

# Form implementation generated from reading ui file 'ui.ui'
#
# Created by: PyQt5 UI code generator 5.10.1
#
# WARNING! All changes made in this file will be lost!

from PyQt5 import QtCore, QtGui, QtWidgets
import cv2
import imutils
from imutils.video import VideoStream
import socketio
import base64
import numpy as np


class Ui_MainWindow(object):
    def setupUi(self, MainWindow):
        MainWindow.setObjectName("MainWindow")
        MainWindow.resize(800, 600)
        self.centralwidget = QtWidgets.QWidget(MainWindow)
        self.centralwidget.setObjectName("centralwidget")
        self.lbFrame = QtWidgets.QLabel(self.centralwidget)
        self.lbFrame.setGeometry(QtCore.QRect(150, 70, 441, 421))
        self.lbFrame.setObjectName("lbFrame")
        MainWindow.setCentralWidget(self.centralwidget)
        self.menubar = QtWidgets.QMenuBar(MainWindow)
        self.menubar.setGeometry(QtCore.QRect(0, 0, 800, 22))
        self.menubar.setObjectName("menubar")
        MainWindow.setMenuBar(self.menubar)
        self.statusbar = QtWidgets.QStatusBar(MainWindow)
        self.statusbar.setObjectName("statusbar")
        MainWindow.setStatusBar(self.statusbar)

        self.retranslateUi(MainWindow)
        QtCore.QMetaObject.connectSlotsByName(MainWindow)

    def retranslateUi(self, MainWindow):
        _translate = QtCore.QCoreApplication.translate
        MainWindow.setWindowTitle(_translate("MainWindow", "MainWindow"))
        self.lbFrame.setText(_translate("MainWindow", "TextLabel"))

    def go(self):
        # vs = VideoStream(0).start()
        # cv2.namedWindow('frame')

        sio = socketio.Client()

        @sio.on('stream', namespace='/Browser')
        def myStream(encodeImg):
            # src: https://stackoverflow.com/questions/49511753/python-byte-image-to-numpy-array-using-opencv
            decodeImg = cv2.imdecode(np.frombuffer(
                base64.b64decode(encodeImg), np.uint8), cv2.IMREAD_COLOR)
            # cv2.imshow('frame', decodeImg)
            frameRGB = cv2.cvtColor(decodeImg, cv2.COLOR_BGR2RGB)
            self.lbFrame.setPixmap(QtGui.QPixmap.fromImage(QtGui.QImage(
                frameRGB.data, frameRGB.shape[1], frameRGB.shape[0], frameRGB.shape[1]*3, QtGui.QImage.Format_RGB888)))

        sio.connect('http://localhost:8080/', namespaces=['/Browser'])
        sio.wait()

if __name__ == "__main__":
    import sys
    app = QtWidgets.QApplication(sys.argv)
    MainWindow = QtWidgets.QMainWindow()
    ui = Ui_MainWindow()
    ui.setupUi(MainWindow)
    MainWindow.show()
    ui.go()
    sys.exit(app.exec_())
