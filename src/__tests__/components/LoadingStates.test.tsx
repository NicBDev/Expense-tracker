/**
 * Tests for loading states on mutations
 *
 * Verifies:
 *   1. ExpenseForm submit button shows spinner and is disabled while saving
 *   2. ExpenseForm blocks interaction while saving
 *   3. ExpenseList delete button shows spinner for the row being deleted
 *   4. ExpenseList disables all action buttons while a delete is in progress
 */
import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ExpenseForm from "@/components/ExpenseForm";
import ExpenseList from "@/components/ExpenseList";
import { type Expense } from "@/types";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const mockExpense: Expense = {
  id: "exp1",
  date: "2026-05-01",
  amount: 42,
  category: "Food",
  description: "Lunch",
  createdAt: "2026-05-01T12:00:00Z",
};

const mockExpenses: Expense[] = [
  mockExpense,
  { ...mockExpense, id: "exp2", description: "Coffee" },
];

// ─── ExpenseForm loading state ────────────────────────────────────────────────

describe("ExpenseForm — loading states", () => {
  it("disables the submit button when isSaving=true", () => {
    render(
      <ExpenseForm
        isSaving={true}
        onSave={jest.fn()}
        onCancel={jest.fn()}
      />
    );
    expect(screen.getByRole("button", { name: /add expense/i })).toBeDisabled();
  });

  it("submit button is enabled when isSaving=false", () => {
    render(
      <ExpenseForm
        isSaving={false}
        onSave={jest.fn()}
        onCancel={jest.fn()}
      />
    );
    expect(screen.getByRole("button", { name: /add expense/i })).not.toBeDisabled();
  });

  it("cancel button is also disabled while saving", () => {
    render(
      <ExpenseForm
        isSaving={true}
        onSave={jest.fn()}
        onCancel={jest.fn()}
      />
    );
    expect(screen.getByRole("button", { name: /cancel/i })).toBeDisabled();
  });

  it("calls onSave with the expense data when form is submitted", async () => {
    const onSave = jest.fn().mockResolvedValue(undefined);
    render(<ExpenseForm onSave={onSave} onCancel={jest.fn()} />);

    // Amount input is type=number → role=spinbutton
    await userEvent.type(screen.getByRole("spinbutton"), "25");
    await userEvent.type(screen.getByRole("textbox"), "Test expense");
    await userEvent.click(screen.getByRole("button", { name: /add expense/i }));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 25,
          description: "Test expense",
          category: "Food",
        })
      );
    });
  });

  it("disables the button during async onSave and re-enables after completion", async () => {
    let resolve!: () => void;
    const onSave = jest.fn().mockReturnValue(new Promise<void>((r) => { resolve = r; }));

    render(<ExpenseForm onSave={onSave} onCancel={jest.fn()} />);

    await userEvent.type(screen.getByRole("spinbutton"), "10");
    await userEvent.type(screen.getByRole("textbox"), "Test item");
    await userEvent.click(screen.getByRole("button", { name: /add expense/i }));

    // During save — button is disabled
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /add expense/i })).toBeDisabled();
    });

    // Resolve the async operation
    resolve();

    // After save — button is re-enabled
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /add expense/i })).not.toBeDisabled();
    });
  });
});

// ─── ExpenseList loading state ────────────────────────────────────────────────

describe("ExpenseList — delete loading states", () => {
  const defaultProps = {
    expenses: mockExpenses,
    sortField: "date" as const,
    sortOrder: "desc" as const,
    deletingId: null,
    onSort: jest.fn(),
    onEdit: jest.fn(),
    onDelete: jest.fn(),
  };

  it("all delete buttons are enabled when deletingId is null", () => {
    render(<ExpenseList {...defaultProps} />);
    screen.getAllByTitle("Delete").forEach((btn) => expect(btn).not.toBeDisabled());
  });

  it("shows a spinner label on the row being deleted", () => {
    render(<ExpenseList {...defaultProps} deletingId="exp1" />);
    // Both desktop table and mobile card render, so there are 2 matches
    const spinners = screen.getAllByLabelText("Deleting…");
    expect(spinners.length).toBeGreaterThanOrEqual(1);
  });

  it("disables all delete buttons while a delete is in progress", () => {
    render(<ExpenseList {...defaultProps} deletingId="exp1" />);
    // All delete-related buttons should be disabled (both rows locked)
    const deleteButtons = screen.queryAllByTitle("Delete");
    deleteButtons.forEach((btn) => expect(btn).toBeDisabled());
  });

  it("disables edit buttons while a delete is in progress", () => {
    render(<ExpenseList {...defaultProps} deletingId="exp1" />);
    screen.getAllByTitle("Edit").forEach((btn) => expect(btn).toBeDisabled());
  });

  it("does not disable buttons when no delete is in progress", () => {
    render(<ExpenseList {...defaultProps} deletingId={null} />);
    screen.getAllByTitle("Edit").forEach((btn) => expect(btn).not.toBeDisabled());
  });
});
