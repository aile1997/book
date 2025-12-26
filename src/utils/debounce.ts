/**
 * 防抖函数
 * @param func 要执行的函数
 * @param delay 延迟时间（毫秒）
 * @returns 经过防抖处理的函数
 */
export function debounce<T extends (...args: any[]) => any>(func: T, delay: number): T & { cancel: () => void } {
  let timeoutId: number | undefined;

  const debounced = function (this: ThisParameterType<T>, ...args: Parameters<T>) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func.apply(this, args);
    }, delay) as unknown as number;
  } as T & { cancel: () => void };

  debounced.cancel = function() {
    clearTimeout(timeoutId);
  };

  return debounced;
}
