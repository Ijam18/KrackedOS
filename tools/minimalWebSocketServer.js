import crypto from 'node:crypto';

const WS_GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';

function createFrame(opcode, payload = Buffer.alloc(0)) {
  const source = Buffer.isBuffer(payload) ? payload : Buffer.from(payload);
  const length = source.length;
  let header;

  if (length < 126) {
    header = Buffer.alloc(2);
    header[1] = length;
  } else if (length < 65536) {
    header = Buffer.alloc(4);
    header[1] = 126;
    header.writeUInt16BE(length, 2);
  } else {
    header = Buffer.alloc(10);
    header[1] = 127;
    header.writeBigUInt64BE(BigInt(length), 2);
  }

  header[0] = 0x80 | (opcode & 0x0f);
  return Buffer.concat([header, source]);
}

function unmaskPayload(payload, mask) {
  const next = Buffer.alloc(payload.length);
  for (let index = 0; index < payload.length; index += 1) {
    next[index] = payload[index] ^ mask[index % 4];
  }
  return next;
}

export class MinimalWebSocketConnection {
  constructor(socket, head = Buffer.alloc(0)) {
    this.socket = socket;
    this.buffer = Buffer.isBuffer(head) && head.length ? Buffer.from(head) : Buffer.alloc(0);
    this.isClosed = false;
    this.onTextMessage = null;
    this.onBinaryMessage = null;
    this.onClose = null;

    this.socket.on('data', (chunk) => {
      this.buffer = Buffer.concat([this.buffer, chunk]);
      this.processFrames();
    });
    this.socket.on('close', () => {
      this.handleClose();
    });
    this.socket.on('end', () => {
      this.handleClose();
    });
    this.socket.on('error', () => {
      this.handleClose();
    });

    this.processFrames();
  }

  handleClose() {
    if (this.isClosed) return;
    this.isClosed = true;
    this.onClose?.();
  }

  processFrames() {
    while (!this.isClosed) {
      if (this.buffer.length < 2) return;

      const firstByte = this.buffer[0];
      const secondByte = this.buffer[1];
      const opcode = firstByte & 0x0f;
      const masked = (secondByte & 0x80) !== 0;
      let payloadLength = secondByte & 0x7f;
      let offset = 2;

      if (payloadLength === 126) {
        if (this.buffer.length < 4) return;
        payloadLength = this.buffer.readUInt16BE(2);
        offset = 4;
      } else if (payloadLength === 127) {
        if (this.buffer.length < 10) return;
        payloadLength = Number(this.buffer.readBigUInt64BE(2));
        offset = 10;
      }

      const maskLength = masked ? 4 : 0;
      const frameLength = offset + maskLength + payloadLength;
      if (this.buffer.length < frameLength) return;

      const mask = masked ? this.buffer.subarray(offset, offset + 4) : null;
      const payloadStart = offset + maskLength;
      const payload = this.buffer.subarray(payloadStart, payloadStart + payloadLength);
      this.buffer = this.buffer.subarray(frameLength);

      const decodedPayload = masked && mask ? unmaskPayload(payload, mask) : Buffer.from(payload);

      if (opcode === 0x8) {
        this.close();
        return;
      }

      if (opcode === 0x9) {
        this.socket.write(createFrame(0x0a, decodedPayload));
        continue;
      }

      if (opcode === 0x1) {
        this.onTextMessage?.(decodedPayload.toString('utf8'));
        continue;
      }

      if (opcode === 0x2) {
        this.onBinaryMessage?.(decodedPayload);
      }
    }
  }

  sendText(text) {
    if (this.isClosed) return;
    this.socket.write(createFrame(0x1, Buffer.from(String(text || ''), 'utf8')));
  }

  sendBinary(payload) {
    if (this.isClosed) return;
    this.socket.write(createFrame(0x2, payload));
  }

  close() {
    if (this.isClosed) return;
    this.socket.write(createFrame(0x8));
    this.socket.end();
    this.handleClose();
  }
}

export function acceptWebSocketUpgrade(req, socket, head = Buffer.alloc(0)) {
  const upgradeHeader = String(req.headers.upgrade || '').toLowerCase();
  const connectionHeader = String(req.headers.connection || '').toLowerCase();
  const websocketKey = String(req.headers['sec-websocket-key'] || '');

  if (upgradeHeader !== 'websocket' || !connectionHeader.includes('upgrade') || !websocketKey) {
    socket.destroy();
    return null;
  }

  const acceptValue = crypto
    .createHash('sha1')
    .update(`${websocketKey}${WS_GUID}`)
    .digest('base64');

  socket.write([
    'HTTP/1.1 101 Switching Protocols',
    'Upgrade: websocket',
    'Connection: Upgrade',
    `Sec-WebSocket-Accept: ${acceptValue}`,
    '\r\n'
  ].join('\r\n'));

  return new MinimalWebSocketConnection(socket, head);
}
