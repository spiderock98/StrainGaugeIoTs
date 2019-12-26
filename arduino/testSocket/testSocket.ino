#include <ESP8266WiFi.h>
#include <SocketIOClient.h>
#include "HX711.h"

SocketIOClient client;
const char* ssid = "HTC-U11";
const char* password = "tiendeptrai123";

char host3[] = "27.78.42.155";
char host2[] = "192.168.1.4";
char host1[] = "192.168.43.233";
int port = 8080;
char nspEsp[] = "Esp8266"; // Namespace
unsigned long sensorVal = 0, preSensorVal = 0, randVal = 0;
long long previousMillis = 0;

HX711 scale;

void setup() {
  // put your setup code here, to run once:
  scale.begin(4, 5);
  scale.set_gain(128);
  Serial.begin(115200);
  delay(500);
  
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) { //Thoát ra khỏi vòng 
      delay(500);
      Serial.print('.');
  }
  Serial.print(F("\nIP: "));
  Serial.println(WiFi.localIP());

  /*bool ret = client.connect(host1, port);
  Serial.println(ret);*/

  //client.connect(host1, port);

  if (!client.connect(host1, port)) {
    Serial.println("Failed to connect to host1");
    /*if (!client.connect(host2, port)){
      Serial.println("Ket noi den host2 that bai!");
      return;
    }*/
    return;
  }
  
  if (client.connected()) {
    Serial.println("Succesful connected to host1");
  }
}

void loop() {
  // put your main code here, to run repeatedly:
  
  
  if (millis() - previousMillis > 1000) {
    previousMillis = millis();

    sensorVal = scale.read();
    if ((sensorVal > 50000) && (sensorVal != preSensorVal) ){
      preSensorVal = sensorVal;
      client.send("sensor", "value", (String)sensorVal);
    }

    
    /*randVal = random(1,5000);
    if (randVal > 2500){
      Serial.println(randVal);
      client.send("sensor", "value", (String)randVal);
    }*/
  }

  if (!client.connected()) {
    Serial.println("Attemping to reconnect ...");
    client.reconnect(host1, port);
  }
}
