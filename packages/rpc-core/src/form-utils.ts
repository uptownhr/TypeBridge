/**
 * Utilities for converting FormData to typed objects
 */

export type FormDataValue = string | number | boolean | Date | File | null;
export type FormDataObject = { [key: string]: FormDataValue | FormDataValue[] };

/**
 * Converts FormData to a plain object with proper type conversion
 */
export function formDataToObject(formData: FormData): FormDataObject {
  const result: FormDataObject = {};
  
  for (const [key, value] of formData.entries()) {
    // Handle array fields (multiple values with same name)
    if (key.endsWith('[]')) {
      const arrayKey = key.slice(0, -2);
      if (!result[arrayKey]) {
        result[arrayKey] = [];
      }
      (result[arrayKey] as FormDataValue[]).push(convertFormValue(value));
    } else if (result[key] !== undefined) {
      // Convert single value to array if we encounter duplicate keys
      if (!Array.isArray(result[key])) {
        result[key] = [result[key] as FormDataValue];
      }
      (result[key] as FormDataValue[]).push(convertFormValue(value));
    } else {
      result[key] = convertFormValue(value);
    }
  }
  
  return result;
}

/**
 * Converts form field values to appropriate types
 */
function convertFormValue(value: FormDataEntryValue): FormDataValue {
  if (value instanceof File) {
    return value;
  }
  
  const stringValue = value as string;
  
  // Handle empty values
  if (stringValue === '') {
    return null;
  }
  
  // Handle boolean values
  if (stringValue === 'true') return true;
  if (stringValue === 'false') return false;
  
  // Handle numbers
  if (/^\d+$/.test(stringValue)) {
    const num = parseInt(stringValue, 10);
    if (!isNaN(num)) return num;
  }
  
  if (/^\d*\.\d+$/.test(stringValue)) {
    const num = parseFloat(stringValue);
    if (!isNaN(num)) return num;
  }
  
  // Handle dates (ISO format)
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(stringValue)) {
    const date = new Date(stringValue);
    if (!isNaN(date.getTime())) return date;
  }
  
  // Handle date-only format
  if (/^\d{4}-\d{2}-\d{2}$/.test(stringValue)) {
    const date = new Date(stringValue + 'T00:00:00.000Z');
    if (!isNaN(date.getTime())) return date;
  }
  
  // Return as string
  return stringValue;
}

/**
 * Type helper to extract parameter type from a function
 */
export type ExtractFormData<T> = T extends (data: infer P) => any ? P : never;