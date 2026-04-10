import { createClient } from "redis";

type RedisClient = ReturnType<typeof createClient>;

let _publisher: RedisClient | null = null;
let _subscriber: RedisClient | null = null;

function makeClient(): RedisClient {
  const client = createClient({ url: process.env.REDIS_URL });
  client.on("error", (err) => console.error("[redis-pubsub] error:", err));
  return client;
}

export async function getPublisher(): Promise<RedisClient> {
  if (!_publisher) {
    _publisher = makeClient();
    await _publisher.connect();
  }
  return _publisher;
}

export async function getSubscriber(): Promise<RedisClient> {
  if (!_subscriber) {
    _subscriber = makeClient();
    await _subscriber.connect();
  }
  return _subscriber;
}
