import mqtt from 'mqtt';
import appSettings from './appSettings.js';
import { z } from 'zod';
import { roomIdFormat } from './formats/index.js';
import {
  ServerToClientJsonCodec,
  ServerToClientMessage,
} from '@chat-next/dto/serverToClient/ServerToClientMessage';

const mqttClient = await mqtt.connectAsync(appSettings.mqttBrokerUrl);

mqttClient.on('connect', () => {
  console.log('MQTT client connected');
});

const activeRooms = new Map<string, (message: Buffer) => void>();

const roomTopicPrefix = 'room/';
const roomTopicFormat = z.templateLiteral([roomTopicPrefix, roomIdFormat]);

function topicToRoom(topic: string) {
  const roomTopicValidationResult = roomTopicFormat.safeParse(topic);
  if (!roomTopicValidationResult.success) {
    throw new Error(`Invalid room topic: ${topic}`);
  }
  return roomTopicValidationResult.data.substring(roomTopicPrefix.length);
}

mqttClient.on('message', (topic, message) => {
  console.log(`MQTT message received: Topic: '${topic}'. ${message}.`);
  const room = topicToRoom(topic);
  if (activeRooms.has(room)) {
    activeRooms.get(room)?.(message);
  }
});

function roomToTopic(room: string) {
  const roomValidationResult = roomIdFormat.safeParse(room);
  if (!roomValidationResult.success) {
    throw new Error(`Invalid room: ${room}`);
  }
  return `${roomTopicPrefix}${roomValidationResult.data}` as const;
}

export async function subscribeToRoom(
  room: string,
  callback: (message: Buffer) => void,
) {
  const topic = roomToTopic(room);
  if (activeRooms.has(room)) {
    throw new Error(`Room ${room} is already subscribed`);
  }
  activeRooms.set(room, callback);
  return mqttClient.subscribeAsync(topic);
}

export async function unsubscribeFromRoom(room: string) {
  const topic = roomToTopic(room);
  if (!activeRooms.has(room)) {
    throw new Error(`Room ${room} is not subscribed`);
  }
  activeRooms.delete(room);
  return mqttClient.unsubscribeAsync(topic);
}

export async function publishServerToClientMessageToRoom(
  room: string,
  message: ServerToClientMessage,
) {
  const serialisedMessage = ServerToClientJsonCodec.encode(message);
  return publishSerialisedToRoom(room, serialisedMessage);
}

export async function publishSerialisedToRoom(room: string, message: string) {
  return mqttClient.publishAsync(roomToTopic(room), message);
}
