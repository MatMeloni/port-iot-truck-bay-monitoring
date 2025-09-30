// Placeholder do firmware ESP32.
// Ver arquivo de exemplo enviado no chat: WiFi + MQTT (PubSubClient) + histerese.
// TODO: adicionar versão final aqui.

#include <WiFi.h>
#include <PubSubClient.h>

// ======= PINOS =======
#define TRIG_PIN 17
#define ECHO_PIN 18
#define LED_VERDE 16
#define LED_VERMELHO 4

// ======= WIFI =======
const char* WIFI_SSID = "SEU_WIFI";
const char* WIFI_PASS = "SUA_SENHA";

// ======= MQTT (broker no seu PC via Docker) =======
// Use o IP da sua máquina (ipconfig) e a porta 1883
const char* MQTT_HOST = "192.168.0.100";  // <--- ajuste aqui
const uint16_t MQTT_PORT = 1883;
const char* MQTT_USER = "";   // se usar auth no broker
const char* MQTT_PASSWD = ""; // se usar auth no broker

// ======= IDENTIFICAÇÃO DA VAGA =======
const char* SPACE_ID = "A1";  // seu protótipo
String baseTopic = String("parking/space/") + SPACE_ID + "/";

// ======= HISTERESE =======
enum State { FREE, OCCUPIED };
State current = FREE;
const float THRESH_OCCUPIED = 18.0f; // entra ocupado
const float THRESH_FREE     = 22.0f; // volta a livre

// ======= VARIÁVEIS =======
long duracao;
float distancia_cm;
unsigned long lastTelemetryMs = 0;
const unsigned long TELEMETRY_INTERVAL_MS = 10000; // envia distância a cada 10s

WiFiClient wifiClient;
PubSubClient mqtt(wifiClient);

// ======= MEDIÇÃO =======
float measureDistanceCm() {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);

  duracao = pulseIn(ECHO_PIN, HIGH, 30000); // timeout 30ms
  return (duracao * 0.034f / 2.0f);
}

void applyOutputs() {
  if (current == OCCUPIED) {
    digitalWrite(LED_VERMELHO, HIGH);
    digitalWrite(LED_VERDE, LOW);
  } else {
    digitalWrite(LED_VERMELHO, LOW);
    digitalWrite(LED_VERDE, HIGH);
  }
}

void publishStatus(bool force = false) {
  static State lastSent = FREE;
  if (force || lastSent != current) {
    const char* s = (current == OCCUPIED) ? "occupied" : "free";
    mqtt.publish((baseTopic + "status").c_str(), s, true); // retained
    lastSent = current;
  }
}

void publishDistance(float cm) {
  char payload[64];
  snprintf(payload, sizeof(payload), "{\"cm\":%.2f,\"ts\":%lu}", cm, millis());
  mqtt.publish((baseTopic + "distance").c_str(), payload, true); // retained
}

void wifiConnect() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
  }
}

void mqttConnect() {
  while (!mqtt.connected()) {
    String clientId = "esp32-parking-" + String((uint32_t)ESP.getEfuseMac(), HEX);
    // LWT: se cair, publica "offline"
    mqtt.setWill((baseTopic + "online").c_str(), "offline", true, 1);
    if (mqtt.connect(clientId.c_str(), MQTT_USER, MQTT_PASSWD)) {
      mqtt.publish((baseTopic + "online").c_str(), "online", true);
      publishStatus(true); // envia status inicial
    } else {
      delay(1000);
    }
  }
}

void setup() {
  Serial.begin(115200);
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  pinMode(LED_VERDE, OUTPUT);
  pinMode(LED_VERMELHO, OUTPUT);

  wifiConnect();
  mqtt.setServer(MQTT_HOST, MQTT_PORT);
  mqttConnect();
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) wifiConnect();
  if (!mqtt.connected()) mqttConnect();
  mqtt.loop();

  // Medição
  distancia_cm = measureDistanceCm();
  Serial.printf("Dist: %.2f cm\n", distancia_cm);

  // Histerese para estabilidade
  if (current == FREE && distancia_cm < THRESH_OCCUPIED) {
    current = OCCUPIED;
  } else if (current == OCCUPIED && distancia_cm > THRESH_FREE) {
    current = FREE;
  }

  // Aplica LEDs e publica mudança de estado
  applyOutputs();
  publishStatus(); // só envia quando muda

  // Telemetria de distância periódica
  if (millis() - lastTelemetryMs > TELEMETRY_INTERVAL_MS) {
    lastTelemetryMs = millis();
    publishDistance(distancia_cm);
  }

  delay(200); // taxa de leitura
}
