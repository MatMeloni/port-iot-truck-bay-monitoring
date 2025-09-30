import mqtt, { IClientOptions, MqttClient } from 'mqtt';

let cachedClient: MqttClient | null = null;
const MOCK_MODE = process.env.NEXT_PUBLIC_MOCK_MODE === 'true';

function resolveOptions(): { url: string; options: IClientOptions } | null {
  const url = process.env.NEXT_PUBLIC_MQTT_URL;
  if (!url) {
    console.warn('[mqtt] NEXT_PUBLIC_MQTT_URL is not defined.');
    return null;
  }

  const options: IClientOptions = {
    reconnectPeriod: 1_000,
    clean: true,
  };

  const username = process.env.NEXT_PUBLIC_MQTT_USERNAME;
  const password = process.env.NEXT_PUBLIC_MQTT_PASSWORD;

  if (username) options.username = username;
  if (password) options.password = password;

  return { url, options };
}

export function getMqttClient(): MqttClient | null {
  if (MOCK_MODE) return null;
  if (typeof window === 'undefined') return null;

  if (cachedClient && !cachedClient.disconnected) return cachedClient;

  const resolved = resolveOptions();
  if (!resolved) return null;

  try {
    cachedClient = mqtt.connect(resolved.url, resolved.options);

    cachedClient.on('close', () => {
      cachedClient = null;
    });

    return cachedClient;
  } catch (error) {
    console.error('[mqtt] Failed to initialise client:', error);
    cachedClient = null;
    return null;
  }
}

export function disconnectMqttClient(): void {
  if (!cachedClient) return;
  try {
    cachedClient.end(true);
  } catch (error) {
    console.error('[mqtt] Failed to disconnect client:', error);
  } finally {
    cachedClient = null;
  }
}

