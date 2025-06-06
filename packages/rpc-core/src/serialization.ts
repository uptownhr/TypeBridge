import { RPCSerializable, RPCError, RPCErrorCode } from './types.js';

export function serialize(value: RPCSerializable): string {
  try {
    return JSON.stringify(value, (key, val) => {
      if (val instanceof Date) {
        return { __type: 'Date', value: val.toISOString() };
      }
      return val;
    });
  } catch (error) {
    throw new RPCError(
      `Failed to serialize value: ${error instanceof Error ? error.message : 'Unknown error'}`,
      RPCErrorCode.SERIALIZATION_ERROR,
      500,
      undefined,
      { originalValue: typeof value }
    );
  }
}

export function deserialize(json: string): RPCSerializable {
  try {
    return JSON.parse(json, (key, val) => {
      if (val && typeof val === 'object' && val.__type === 'Date') {
        return new Date(val.value);
      }
      return val;
    });
  } catch (error) {
    throw new RPCError(
      `Failed to deserialize JSON: ${error instanceof Error ? error.message : 'Unknown error'}`,
      RPCErrorCode.DESERIALIZATION_ERROR,
      400,
      undefined,
      { json: json.substring(0, 100) }
    );
  }
}

export function validateSerializable(value: any): value is RPCSerializable {
  if (value === null || typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return true;
  }
  
  if (value instanceof Date) {
    return true;
  }
  
  if (Array.isArray(value)) {
    return value.every(validateSerializable);
  }
  
  if (typeof value === 'object') {
    return Object.values(value).every(validateSerializable);
  }
  
  return false;
}