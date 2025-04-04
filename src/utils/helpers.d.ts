export function debounce(func: Function, wait: number, immediate?: boolean): Function;
export function throttle(func: Function, limit: number): Function;
export function formatNumber(num: number): string;
export function formatDate(date: Date | string, options?: Object): string;
export function generateId(length?: number): string;
export function deepClone(obj: Object): Object;
export function isEmpty(obj: Object | string | null | undefined): boolean;
export function getValueByPath(obj: Object, path: string, defaultValue?: any): any;
