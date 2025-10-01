#include <WiFi.h>
#include <PubSubClient.h>

// === Pinos (seu mapeamento atual) ===
#define TRIG_PIN       12
#define ECHO_PIN       13
#define LED_VERDE      33
#define LED_VERMELHO   25

// === Wi-Fi / MQTT ===
const char* WIFI_SSID   = NEXT_PUBLIC_WIFI_SSID;
const char* WIFI_PASS   = NEXT_PUBLIC_WIFI_PASS;

// IP do PC onde o Mosquitto está rodando (veja "ipconfig")
const char* MQTT_BROKER = "192.168.1.121";
const uint16_t MQTT_PORT = 1883;

const char* SLOT_ID     = "bay-01";  // id da vaga

// Tópicos
String topicStatus     = String("parking/") + SLOT_ID + "/status";   // retain
String topicHeartbeat  = String("parking/") + SLOT_ID + "/heartbeat";
String topicLWT        = String("parking/") + SLOT_ID + "/lwt";

WiFiClient espClient;
PubSubClient mqtt(espClient);

// === Sensor / medição ===
const float SOUND_SPEED_CM_PER_US = 0.034f;
const uint8_t SAMPLES             = 5;      // média simples
const float OCCUPIED_THRESHOLD    = 20.0;   // cm  -> abaixo: ocupado
const float FREE_THRESHOLD        = 25.0;   // cm  -> acima: livre (histerese)

// Estado
enum SlotState { FREE = 0, OCCUPIED = 1 };
SlotState currentState = FREE;
SlotState lastState    = FREE;

unsigned long lastHeartbeatMs = 0;
const unsigned long HEARTBEAT_INTERVAL = 30000; // 30s

// === Wi-Fi ===
void wifiConnect() {
  if (WiFi.status() == WL_CONNECTED) return;
  Serial.print("[WiFi] Conectando a ");
  Serial.print(WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASS);

  uint32_t t0 = millis();
  while (WiFi.status() != WL_CONNECTED) {
    delay(300);
    Serial.print(".");
    if (millis() - t0 > 15000) { // 15s timeout
      Serial.println("\n[WiFi] Timeout. Reiniciando WiFi...");
      WiFi.disconnect();
      delay(1000);
      WiFi.begin(WIFI_SSID, WIFI_PASS);
      t0 = millis();
    }
  }
  Serial.print("\n[WiFi] Conectado. IP: ");
  Serial.println(WiFi.localIP());
}

// === MQTT ===
void mqttConnect() {
  mqtt.setServer(MQTT_BROKER, MQTT_PORT);
  mqtt.setKeepAlive(30); // opcional

  while (!mqtt.connected()) {
    String clientId = String("esp32-") + SLOT_ID + "-" + String((uint32_t)ESP.getEfuseMac(), HEX);
    Serial.print("[MQTT] Conectando ao broker ");
    Serial.print(MQTT_BROKER); Serial.print(":"); Serial.print(MQTT_PORT);
    Serial.print(" (clientId="); Serial.print(clientId); Serial.print(") ... ");

    // SEM usuário/senha + LWT via connect()
    // mqtt.connect(clientId, willTopic, willQos, willRetain, willMessage)
    if (mqtt.connect(clientId.c_str(), topicLWT.c_str(), 1, true, "offline")) {
      Serial.println("OK");
      mqtt.publish(topicLWT.c_str(), "online", true);  // sinaliza online (retain)
    } else {
      Serial.print("falhou, rc="); Serial.print(mqtt.state());
      Serial.println(" -> tentando de novo em 2s");
      delay(2000);
    }
  }
}

// === Distância com média e timeout ===
float readDistanceCm() {
  float sum = 0.0f;
  uint8_t valid = 0;

  for (uint8_t i = 0; i < SAMPLES; i++) {
    // Pulso no TRIG
    digitalWrite(TRIG_PIN, LOW);  delayMicroseconds(2);
    digitalWrite(TRIG_PIN, HIGH); delayMicroseconds(10);
    digitalWrite(TRIG_PIN, LOW);

    // Echo com timeout (30 ms ~ ~5 m)
    unsigned long duracao = pulseIn(ECHO_PIN, HIGH, 30000UL);
    if (duracao > 0) {
      float dist = (duracao * SOUND_SPEED_CM_PER_US) / 2.0f;
      sum += dist;
      valid++;
    }
    delay(10);
  }

  if (valid == 0) return NAN;
  return sum / valid;
}

void publishStatus(SlotState state, float distance) {
  const char* statusStr = (state == OCCUPIED) ? "occupied" : "free";
  bool ok = mqtt.publish(topicStatus.c_str(), statusStr, true); // retain
  Serial.print("[MQTT] Status -> ");
  Serial.print(statusStr);
  Serial.print(" (distance=");
  Serial.print(distance, 1);
  Serial.print(" cm, retain) ");
  Serial.println(ok ? "OK" : "ERRO");
}

void publishHeartbeat(float distance) {
  char payload[128];
  snprintf(payload, sizeof(payload),
           "{\"slot\":\"%s\",\"distance_cm\":%.1f,\"rssi\":%d,\"uptime_s\":%lu}",
           SLOT_ID, distance, WiFi.RSSI(), millis()/1000UL);
  bool ok = mqtt.publish(topicHeartbeat.c_str(), payload, false);
  Serial.print("[MQTT] Heartbeat -> ");
  Serial.println(ok ? payload : "ERRO");
}

void setup() {
  Serial.begin(115200);
  delay(200);

  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  pinMode(LED_VERDE, OUTPUT);
  pinMode(LED_VERMELHO, OUTPUT);

  digitalWrite(LED_VERMELHO, LOW);
  digitalWrite(LED_VERDE, HIGH);

  Serial.println("\n=== ESP32 Parking MQTT ===");
  Serial.print("Broker: "); Serial.print(MQTT_BROKER); Serial.print(":"); Serial.println(MQTT_PORT);
  Serial.print("Topics: "); Serial.print(topicStatus); Serial.print(", ");
  Serial.print(topicHeartbeat); Serial.print(", ");
  Serial.println(topicLWT);

  wifiConnect();
  mqttConnect();
}

void loop() {
  // Mantém conexões
  if (WiFi.status() != WL_CONNECTED) wifiConnect();
  if (!mqtt.connected())            mqttConnect();
  mqtt.loop();

  // Mede distância
  float distancia_cm = readDistanceCm();
  if (isnan(distancia_cm)) {
    Serial.println("[SENSOR] Sem leitura válida");
    delay(200);
    return;
  }

  // Estado com histerese
  SlotState before = currentState;
  if (currentState == FREE     && distancia_cm < OCCUPIED_THRESHOLD) currentState = OCCUPIED;
  if (currentState == OCCUPIED && distancia_cm > FREE_THRESHOLD)     currentState = FREE;

  // LEDs
  if (currentState == OCCUPIED) {
    digitalWrite(LED_VERMELHO, HIGH);
    digitalWrite(LED_VERDE, LOW);
  } else {
    digitalWrite(LED_VERMELHO, LOW);
    digitalWrite(LED_VERDE, HIGH);
  }

  // Logs de distância (a cada loop)
  static uint32_t lastPrint = 0;
  if (millis() - lastPrint > 1000) {
    Serial.print("[SENSOR] Distancia: ");
    Serial.print(distancia_cm, 1);
    Serial.println(" cm");
    lastPrint = millis();
  }

  // Publica apenas quando mudar de estado
  if (currentState != lastState) {
    Serial.print("[STATE] Mudou: ");
    Serial.print((lastState == OCCUPIED) ? "OCCUPIED" : "FREE");
    Serial.print(" -> ");
    Serial.println((currentState == OCCUPIED) ? "OCCUPIED" : "FREE");
    publishStatus(currentState, distancia_cm);
    lastState = currentState;
  }

  // Heartbeat periódico
  if (millis() - lastHeartbeatMs >= HEARTBEAT_INTERVAL) {
    publishHeartbeat(distancia_cm);
    lastHeartbeatMs = millis();
  }

  delay(120);
}
