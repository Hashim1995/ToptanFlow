import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { toApiDateTime } from './baku-datetime.js';

const UTC_ISO_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?Z$/;

/**
 * JSON.stringify(Date) always emits UTC `...Z`, which looks 4 hours “behind”
 * in Azerbaijan. Convert every Date (and leftover UTC ISO string) in the
 * response tree to Asia/Baku offset ISO (`...+04:00`) before serialization.
 */
@Injectable()
export class BakuDateSerializationInterceptor implements NestInterceptor {
  intercept(
    _context: ExecutionContext,
    next: CallHandler,
  ): Observable<unknown> {
    return next.handle().pipe(map((data) => convertDatesDeep(data)));
  }
}

function convertDatesDeep(value: unknown): unknown {
  if (value instanceof Date) {
    return toApiDateTime(value);
  }
  if (Array.isArray(value)) {
    return value.map((item) => convertDatesDeep(item));
  }
  if (value !== null && typeof value === 'object') {
    // Leave Prisma Decimal, Buffer, class instances intact (Nest/JSON use toJSON).
    const proto = Object.getPrototypeOf(value) as object | null;
    if (proto !== Object.prototype && proto !== null) {
      return value;
    }
    const record = value as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(record)) {
      out[key] = convertDatesDeep(record[key]);
    }
    return out;
  }
  if (typeof value === 'string' && UTC_ISO_RE.test(value)) {
    return toApiDateTime(value);
  }
  return value;
}
