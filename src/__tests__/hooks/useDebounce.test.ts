/**
 * Tests for useDebounce hook
 * Verifies that the debounced value only updates after the specified delay.
 */
import { renderHook, act } from "@testing-library/react";
import { useDebounce } from "@/hooks/useDebounce";

jest.useFakeTimers();

describe("useDebounce", () => {
  afterEach(() => {
    jest.clearAllTimers();
  });

  it("returns the initial value immediately", () => {
    const { result } = renderHook(() => useDebounce("hello", 300));
    expect(result.current).toBe("hello");
  });

  it("does not update the debounced value before the delay", () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: "initial" } }
    );

    rerender({ value: "updated" });

    // Still shows old value before delay
    expect(result.current).toBe("initial");

    act(() => { jest.advanceTimersByTime(299); });
    expect(result.current).toBe("initial");
  });

  it("updates the debounced value after the delay", () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: "initial" } }
    );

    rerender({ value: "updated" });
    act(() => { jest.advanceTimersByTime(300); });

    expect(result.current).toBe("updated");
  });

  it("resets the timer when value changes rapidly", () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: "a" } }
    );

    rerender({ value: "ab" });
    act(() => { jest.advanceTimersByTime(200); });

    rerender({ value: "abc" }); // reset timer
    act(() => { jest.advanceTimersByTime(200); });

    // Not enough time has passed since the last change
    expect(result.current).toBe("a");

    act(() => { jest.advanceTimersByTime(100); });
    expect(result.current).toBe("abc");
  });

  it("uses 300ms as default delay", () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value), // no delay arg
      { initialProps: { value: "initial" } }
    );

    rerender({ value: "updated" });
    act(() => { jest.advanceTimersByTime(299); });
    expect(result.current).toBe("initial");

    act(() => { jest.advanceTimersByTime(1); });
    expect(result.current).toBe("updated");
  });
});
