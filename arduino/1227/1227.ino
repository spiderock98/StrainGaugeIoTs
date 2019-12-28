#include <ESP8266WiFi.h>
#include <SocketIOClient.h>

SocketIOClient client;
const char* ssid = "VIETTEL";
const char* password = "Sherlock2211vtag";

char host1[] = "27.78.42.155";
int port = 8080;
unsigned long randVal = 0;
long long previousMillis = 0;

void setup() {
  Serial.begin(115200);
  delay(500);
  
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) { //Thoát ra khỏi vòng 
    delay(500);
    Serial.print('.');
  }
  Serial.print(F("\nIP: "));
  Serial.println(WiFi.localIP());

  if (!client.connect(host1, port)) {
    Serial.println("Failed to connect to host1");
    return;
  }
  
  if (client.connected()) {
    Serial.println("Succesful connected to host1");
  }
}

void loop() {
  if (millis() - previousMillis > 1000) {
    previousMillis = millis();
    
    randVal = random(1,5000);
    if (randVal > 2500){
      Serial.println(randVal);
      client.send("sensor", "value", String(randVal));
    }
  }

  if (!client.connected()) {
    Serial.println("Attemping to reconnect ...");
    client.reconnect(host1, port);
  }
}