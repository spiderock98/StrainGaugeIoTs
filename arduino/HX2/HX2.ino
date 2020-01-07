#include "HX711.h"
long a,b;
// HX711.DOUT  - pin #A1
// HX711.PD_SCK - pin #A0

HX711 scale(4, 5);    // parameter "gain" is ommited; the default value 128 is used by the library

void setup() {
  Serial.begin(9600);
  scale.set_gain(128);
}

void loop() {
 /* Serial.print("one reading:\t");
  Serial.print(scale.get_units(), 1);
  Serial.print("\t| average:\t");
  Serial.println(scale.get_units(10), 1);

  scale.power_down();             // put the ADC in sleep mode
  delay(1000);
  scale.power_up();*/
  a=scale.read();
   Serial.print(a);
   Serial.print("   ");
   b=scale.read_average(20);
   Serial.println(a);
   
     delay(300);
}
