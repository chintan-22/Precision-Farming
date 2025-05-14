#include <Wire.h>
#include <DHT.h>

// Pin definitions
#define MOISTURE_PIN A0
#define PH_PIN A1
#define DHT_PIN 2
#define LED_PIN 9
#define DHT_TYPE DHT11

DHT dht(DHT_PIN, DHT_TYPE);

void setup() {
  Serial.begin(9600);
  delay(500);

  dht.begin();
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, HIGH);
}

void loop() {
  // ---------- Moisture Sensor ----------
  int moistureRaw = analogRead(MOISTURE_PIN);
  float vwc_percent = map(moistureRaw, 0, 1023, 0, 100);
  float root_zone_depth_mm = 300; // Adjust based on your crop/root
  float rainfall_mm = (vwc_percent / 100.0) * root_zone_depth_mm;

  // ---------- DHT Sensor ----------
  float humidity = dht.readHumidity();
  float temperature = dht.readTemperature();

  if (isnan(humidity) || isnan(temperature)) {
    Serial.println("DHT error");
    return;
  }

  // ---------- pH Sensor ----------
  int phRaw = analogRead(PH_PIN);
  float voltage = phRaw * (5.0 / 1023.0);  // Convert analog value to voltage
  float pH_value = 3.5 * voltage + 0.00;   // Adjust formula with calibration

  // ---------- Serial Print ----------
  Serial.print(rainfall_mm);
  Serial.print(",");
  Serial.print(temperature);
  Serial.print(",");
  Serial.print(humidity);
  Serial.print(",");
  Serial.println(pH_value);


  delay(60000);  // 1-minute delay
}
