import {
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

// Realtime queue updates over Socket.io. Clients join a room per shop and
// receive `queue:update` whenever that shop's queue changes. Free & open source.
//
// Frontend usage (once wired):
//   const socket = io('http://localhost:3000', { path: '/socket.io' });
//   socket.emit('queue:subscribe', { shopId });
//   socket.on('queue:update', (state) => { ... });
@WebSocketGateway({
  cors: { origin: true, credentials: true },
})
export class QueueGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  handleConnection() {
    // No-op; clients subscribe to a shop room explicitly below.
  }

  @SubscribeMessage('queue:subscribe')
  onSubscribe(
    @MessageBody() data: { shopId: string },
    @ConnectedSocket() client: Socket,
  ) {
    if (data?.shopId) client.join(`shop:${data.shopId}`);
    return { subscribed: data?.shopId ?? null };
  }

  // Called by QueueService after any mutation to push the fresh state.
  emitQueueUpdate(shopId: string, state: unknown) {
    this.server?.to(`shop:${shopId}`).emit('queue:update', state);
  }
}
