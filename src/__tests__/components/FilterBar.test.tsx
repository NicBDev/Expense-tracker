/**
 * Tests for FilterBar search debounce
 * Verifies that onChange is only called after 300ms of inactivity,
 * not on every keystroke.
 */
import "@testing-library/jest-dom";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import FilterBar from "@/components/FilterBar";
import { type FilterState } from "@/types";

jest.useFakeTimers();

// Bridge userEvent to fake timers so clicks/typing don't hang
const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

afterEach(() => {
  jest.clearAllTimers();
});

const defaultFilter: FilterState = {
  search: "",
  category: "All",
  dateFrom: "",
  dateTo: "",
};

describe("FilterBar — search debounce", () => {
  it("does not call onChange with search value before the delay", async () => {
    const onChange = jest.fn();
    render(<FilterBar filter={defaultFilter} onChange={onChange} />);

    const input = screen.getByPlaceholderText("Search expenses...");
    await user.type(input, "lu");

    // Before debounce fires, onChange should not have been called with the search value
    const searchCalls = onChange.mock.calls.filter(([f]) => f.search === "lu");
    expect(searchCalls).toHaveLength(0);
  });

  it("calls onChange with the debounced value after 300ms", async () => {
    const onChange = jest.fn();
    render(<FilterBar filter={defaultFilter} onChange={onChange} />);

    const input = screen.getByPlaceholderText("Search expenses...");
    await user.type(input, "lunch");

    act(() => { jest.advanceTimersByTime(300); });

    const lastCall = onChange.mock.calls.at(-1)?.[0];
    expect(lastCall?.search).toBe("lunch");
  });

  it("only fires once for a rapid burst of keystrokes", async () => {
    const onChange = jest.fn();
    render(<FilterBar filter={defaultFilter} onChange={onChange} />);

    const input = screen.getByPlaceholderText("Search expenses...");
    await user.type(input, "coffee");

    act(() => { jest.advanceTimersByTime(300); });

    const searchCalls = onChange.mock.calls.filter(([f]) => f.search && f.search.length > 0);
    expect(searchCalls).toHaveLength(1);
    expect(searchCalls[0][0].search).toBe("coffee");
  });

  it("clears search and calls onChange immediately when Clear is clicked", async () => {
    const onChange = jest.fn();
    const activeFilter: FilterState = { ...defaultFilter, search: "test" };
    render(<FilterBar filter={activeFilter} onChange={onChange} />);

    await user.click(screen.getByText("Clear filters"));

    expect(onChange).toHaveBeenCalledWith({
      search: "",
      category: "All",
      dateFrom: "",
      dateTo: "",
    });
  });

  it("category changes call onChange immediately without debounce", async () => {
    const onChange = jest.fn();
    render(<FilterBar filter={defaultFilter} onChange={onChange} />);

    await user.selectOptions(screen.getByRole("combobox"), "Food");

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ category: "Food" })
    );
  });
});
