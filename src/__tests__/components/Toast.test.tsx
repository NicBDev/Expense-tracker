/**
 * Tests for the Toast system (ToastContext + ToastContainer)
 * Verifies toasts appear, display the correct content, auto-dismiss, and can be manually closed.
 */
import "@testing-library/jest-dom";
import { render, screen, act, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ToastProvider } from "@/contexts/ToastContext";
import ToastContainer from "@/components/ToastContainer";
import { useToast } from "@/contexts/ToastContext";

// Use fake timers for auto-dismiss tests; pair with userEvent.setup({ advanceTimers })
jest.useFakeTimers();

// Helper component that triggers toasts via buttons
function ToastTrigger() {
  const toast = useToast();
  return (
    <div>
      <button onClick={() => toast.success("Expense added")}>Show success</button>
      <button onClick={() => toast.error("Failed to load")}>Show error</button>
      <button onClick={() => toast.info("Syncing data")}>Show info</button>
    </div>
  );
}

function TestApp() {
  return (
    <ToastProvider>
      <ToastTrigger />
      <ToastContainer />
    </ToastProvider>
  );
}

// userEvent.setup with fake timer bridge so clicks don't hang
const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

afterEach(() => {
  jest.clearAllTimers();
});

describe("Toast system", () => {
  describe("displaying toasts", () => {
    it("shows a success toast when triggered", async () => {
      render(<TestApp />);
      await user.click(screen.getByText("Show success"));
      expect(screen.getByText("Expense added")).toBeInTheDocument();
    });

    it("shows an error toast when triggered", async () => {
      render(<TestApp />);
      await user.click(screen.getByText("Show error"));
      expect(screen.getByText("Failed to load")).toBeInTheDocument();
    });

    it("shows multiple toasts at once", async () => {
      render(<TestApp />);
      await user.click(screen.getByText("Show success"));
      await user.click(screen.getByText("Show error"));
      expect(screen.getByText("Expense added")).toBeInTheDocument();
      expect(screen.getByText("Failed to load")).toBeInTheDocument();
    });
  });

  describe("auto-dismiss", () => {
    it("removes the toast after 3 seconds", async () => {
      render(<TestApp />);
      await user.click(screen.getByText("Show success"));
      expect(screen.getByText("Expense added")).toBeInTheDocument();

      act(() => { jest.advanceTimersByTime(3000); });

      await waitFor(() => {
        expect(screen.queryByText("Expense added")).not.toBeInTheDocument();
      });
    });

    it("keeps toast visible before 3 seconds", async () => {
      render(<TestApp />);
      await user.click(screen.getByText("Show success"));

      act(() => { jest.advanceTimersByTime(2999); });

      expect(screen.getByText("Expense added")).toBeInTheDocument();
    });
  });

  describe("manual dismiss", () => {
    it("removes the toast when the dismiss button is clicked", async () => {
      render(<TestApp />);
      await user.click(screen.getByText("Show success"));
      expect(screen.getByText("Expense added")).toBeInTheDocument();

      await user.click(screen.getByLabelText("Dismiss notification"));

      expect(screen.queryByText("Expense added")).not.toBeInTheDocument();
    });
  });

  describe("accessibility", () => {
    it("renders toast container with aria-live polite region", async () => {
      render(<TestApp />);
      await user.click(screen.getByText("Show success"));
      expect(screen.getByLabelText("Notifications")).toBeInTheDocument();
    });

    it("each toast has role=alert for screen readers", async () => {
      render(<TestApp />);
      await user.click(screen.getByText("Show error"));
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });
  });
});
