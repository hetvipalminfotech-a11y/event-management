import {
  EventSubscriber,
  EntitySubscriberInterface,
  UpdateEvent,
  RemoveEvent,
} from 'typeorm';

import { AuditLog } from '../entities/audit-log.entity';
import { RequestContext } from '../context/request-context.service';

@EventSubscriber()
export class AuditSubscriber implements EntitySubscriberInterface {

  async afterUpdate(event: UpdateEvent<any>) {

    if (!event.entity || !event.databaseEntity) return;

    const repo = event.manager.getRepository(AuditLog);

    await repo.save({
      user_id: RequestContext.getUserId(),
      action: 'UPDATE',
      entity: event.metadata.tableName,
      entity_id: event.entity.id?.toString() || '',
      old_data: event.databaseEntity,
      new_data: event.entity,
    });
  }

  async afterRemove(event: RemoveEvent<any>) {

    if (!event.databaseEntity) return;

    const repo = event.manager.getRepository(AuditLog);

    await repo.save({
      user_id: RequestContext.getUserId(),
      action: 'DELETE',
      entity: event.metadata.tableName,
      entity_id: event.databaseEntity.id?.toString() || '',
      old_data: event.databaseEntity,
    });
  }

}