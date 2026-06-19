import { describe, it, expect, vi } from 'vitest';
import { keyboardActivate, prefersReducedMotion } from './a11y';

describe('keyboardActivate', () => {
  it('invokes handler on Enter and Space', () => {
    const handler = vi.fn();
    const onKeyDown = keyboardActivate(handler);
    const preventDefault = vi.fn();

    onKeyDown({ key: 'Enter', preventDefault });
    onKeyDown({ key: ' ', preventDefault });

    expect(handler).toHaveBeenCalledTimes(2);
    expect(preventDefault).toHaveBeenCalledTimes(2);
  });

  it('ignores unrelated keys', () => {
    const handler = vi.fn();
    const onKeyDown = keyboardActivate(handler);

    onKeyDown({ key: 'Tab', preventDefault: vi.fn() });

    expect(handler).not.toHaveBeenCalled();
  });
});

describe('prefersReducedMotion', () => {
  it('returns false when window is unavailable', () => {
    vi.stubGlobal('window', undefined);
    expect(prefersReducedMotion()).toBe(false);
    vi.unstubAllGlobals();
  });

  it('returns matchMedia result when available', () => {
    window.matchMedia = vi.fn().mockReturnValue({ matches: true });
    expect(prefersReducedMotion()).toBe(true);

    window.matchMedia = vi.fn().mockReturnValue({ matches: false });
    expect(prefersReducedMotion()).toBe(false);
  });
});
