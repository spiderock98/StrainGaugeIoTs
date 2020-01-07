
/* Arduino pin 2 -> HX711 CLK
 3 -> DOUT
 5V -> VCC
 GND -> GND

 Most any pin on the Arduino Uno will be compatible with DOUT/CLK.

 The HX711 board can be powered from 2.7V to 5V so the Arduino 5V power should be fine.

*/

#include <ESP8266WiFi.h>
#include <SocketIOClient.h>
#include "HX711.h"

#define DOUT  13
#define CLK  12


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

// HX711 scale(DOUT, CLK);
HX711 scale;

float calibration_factor = -13050; //-7050 worked for my 440lb max scale setup

void setup() {
  Serial.begin(115200);
  Serial.println("HX711 calibration sketch");
  Serial.println("Remove all weight from scale");
  Serial.println("After readings begin, place known weight on scale");
  Serial.println("Press + or a to increase calibration factor");
  Serial.println("Press - or z to decrease calibration factor");
  
  scale.begin(DOUT, CLK);
  scale.set_scale();
  scale.tare(); //Reset the scale to 0
  
  long zero_factor = scale.read_average(); //Get a baseline reading
  Serial.print("Zero factor: "); //This can be used to remove the need to tare the scale. Useful in permanent scale projects.
  Serial.println(zero_factor);

  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) { //Thoát ra khỏi vòng 
      delay(500);
      Serial.print('.');
  }
  Serial.print(F("\nIP: "));
  Serial.println(WiFi.localIP());

  if (!client.connect(host1, port)) {
    Serial.println("Failed to connect to host");
    return;
  }
  if (client.connected()) {
    Serial.println("Succesful connected to host");
  }
}

void loop() {
  //sensorVal = scale.get_units();
  scale.set_scale(calibration_factor); //Adjust to this calibration factor
  Serial.print("Reading: ");
  Serial.print(scale.get_units(), 1);
  Serial.print(" lbs"); //Change this to kg and re-adjust the calibration factor if you follow SI units like a sane person
  // Serial.print(" calibration_factor: ");
  // Serial.print(calibration_factor);
  Serial.println();

  if (scale.get_units() > 50){
    Serial.println('Firebase uploaded');
    client.send("sensor", "value", (String)scale.get_units());
  }
  


  if(Serial.available())
  {
    char temp = Serial.read();
    if(temp == '+' || temp == 'a')
      calibration_factor += 10;
    else if(temp == '-' || temp == 'z')
      calibration_factor -= 10;
  }
}
