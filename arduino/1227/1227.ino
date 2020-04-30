#include <ESP8266WiFi.h>
#include <SocketIOClient.h>

SocketIOClient client;
const char *ssid = "VIETTEL";
const char *password = "Sherlock21vtag";

char HOST[] = "116.102.7.90";
//char HOST[] = "192.168.1.3";
int PORT = 8080;
unsigned long randVal = 0;
long long previousMillis = 0;
String MAC;

void setup()
{
  Serial.begin(115200);
  delay(500);

  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED)
  {
    delay(500);
    Serial.print('.');
  }
  Serial.print(F("\nIP: "));
  Serial.println(WiFi.localIP());
  MAC = WiFi.macAddress();
  Serial.print(MAC);

  if (!client.connect(HOST, PORT))
  {
    Serial.println("Failed to connect to HOST");
    return;
  }

  if (client.connected())
  {
    Serial.println("Succesful connected to HOST");
  }
}

void loop()
{
  if (millis() - previousMillis > 3000)
  {
    previousMillis = millis();

    randVal = random(0, 5000);
    client.send("sensor", MAC, String(randVal));
    //    if (randVal > 2500)
    //    {
    //      client.send("sensor", MAC, String(randVal));
    //    }

    /*if (Serial.available() > 0) {
      if (Serial.read() == 'a' ){
        Serial.println(randVal);
        client.send("sensor", MAC, String(randVal));
      }
      }*/
  }

  if (!client.connected())
    client.reconnect(HOST, PORT);
}
