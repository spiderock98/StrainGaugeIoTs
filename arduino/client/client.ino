#include <ESP8266WiFi.h>
#include <SocketIOClient.h>
#include "HX711.h"


SocketIOClient client;
const char* ssid = "VIETTEL";
const char* password = "Sherlock2211vtag";

char host[] = "27.78.42.155";
//char host[] = "192.168.1.4";
int port = 8080;
char nspEsp[] = "Esp8266"; // Namespace
long sensorVal = 0, preSensorVal = 0, randVal = 0;
 
//từ khóa extern: dùng để #include các biến toàn cục ở một số thư viện khác. Trong thư viện SocketIOClient có hai biến toàn cục
// mà chúng ta cần quan tâm đó là
// RID: Tên hàm (tên sự kiện
// Rfull: Danh sách biến (được đóng gói lại là chuối JSON)
extern String RID;
extern String Rfull;

HX711 scale;
 
//Một số biến dùng cho việc tạo một task
unsigned long previousMillis = 0;
long interval = 100; //tick 100ms
 
void setup() {
  scale.begin(4, 5);
  scale.set_gain(128);
  Serial.begin(115200);
  delay(10);

  //Kết nối vào mạng Wifi
  WiFi.begin(ssid, password);

  //Chờ đến khi đã được kết nối
  while (WiFi.status() != WL_CONNECTED) { //Thoát ra khỏi vòng 
      delay(500);
      Serial.print('.');
  }

  Serial.println();
  Serial.println(F("Da ket noi WiFi"));
  Serial.print(F("Dia chi IP cua ESP8266 (Socket Client ESP8266): "));
  Serial.println(WiFi.localIP());

  //Serial.println(client.connect(host, port, nspEsp));
  if (!client.connect(host, port)) {
      Serial.println(F("Ket noi den socket server that bai!"));
      return;
  }

  //Khi đã kết nối thành công
  if (client.connected()) {
      Serial.println("Succesful connected to namespace Esp8266");
  }

  Serial.println("Done Setup");
}
 
void loop()
{
    sensorVal = scale.read();
    /*if (sensorVal != preSensorVal){
      preSensorVal = sensorVal;
      client.send("sensor", sensorVal);
    }*/
    
    if (millis() - previousMillis > 3000) {
      previousMillis = millis();
      randVal = random(1,5000);
      if (randVal > 2500){
        client.send("sensor", String(randVal));
      }
      //gửi sự kiện "atime" là một JSON chứa tham số message có nội dung là Time please?
      //client.send("atime", "message", "Time please?");
    }
 
    //Khi bắt được bất kỳ sự kiện nào thì chúng ta có hai tham số:
    //  +RID: Tên sự kiện
    //  +RFull: Danh sách tham số được nén thành chuỗi JSON!
    /*if (client.monitor()) {
        Serial.println(RID);
        Serial.println(Rfull);
    }*/

    /*if (!client.connected()) {
      Serial.println("Attemping to reconnect ...");
      client.reconnect(host, port, nspEsp);
    }*/
}
