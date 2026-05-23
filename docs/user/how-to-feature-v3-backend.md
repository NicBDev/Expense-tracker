# How to Use SpendWise — V3 Backend Features

This guide covers the new features introduced in V3: accounts, workspaces, shared expense views, and export scheduling.

---

## Getting Started

### Creating an Account

1. Go to the app and click **Register**
2. Enter your name, email, and password
3. Click **Create Account**
4. You'll be redirected to the login page

> 📸 _[Screenshot: Register page with fields]_

---

### Logging In

1. Go to the **Login** page
2. Enter your email and password
3. Click **Sign In**

> 📸 _[Screenshot: Login page]_

---

## Workspaces

Workspaces let you group expenses and collaborate with others (e.g. a household budget, a team project).

### Creating a Workspace

1. After logging in, open the workspace selector in the top navigation
2. Click **New Workspace**
3. Enter a name and confirm

> 📸 _[Screenshot: Workspace selector dropdown with "New Workspace" option]_

### Inviting Members

1. Go to your workspace settings
2. Enter a team member's email address
3. Click **Add Member**
4. They can now log in and see the shared workspace expenses

> 📸 _[Screenshot: Add member form]_

> **Note:** Members can view and add expenses. Only the workspace owner can invite or remove members.

---

## Managing Expenses

All expenses are now saved to the cloud — they persist across devices and sessions.

### Adding an Expense

1. Click **Add Expense**
2. Fill in the date, amount, category, and description
3. Click **Save**

> 📸 _[Screenshot: Expense form]_

### Editing or Deleting an Expense

1. Find the expense in the list
2. Click the **edit** (pencil) or **delete** (trash) icon
3. Confirm your changes

> 📸 _[Screenshot: Expense list with action icons]_

---

## Sharing Expenses

You can share a read-only view of your workspace expenses with anyone — no login required.

### Creating a Shared Link

1. Open the **Export / Share** panel
2. Click **Create Shared Link**
3. Set an expiry date and optional label
4. Copy the generated link and share it

> 📸 _[Screenshot: Shared link creation panel with expiry picker]_

The recipient opens the link in their browser and sees a read-only expense view — no account needed.

> 📸 _[Screenshot: Public shared expense view]_

---

## Scheduled Exports

Automatically export your expenses on a recurring schedule.

### Setting Up a Schedule

1. Go to the **Export** panel
2. Click **Schedule Export**
3. Choose frequency (daily / weekly / monthly), format (CSV / JSON), and destination
4. Click **Save Schedule**

> 📸 _[Screenshot: Schedule export form]_

---

## Export History

View a log of all past exports.

1. Open the **Export** panel
2. Click **Export History**
3. Browse the list of past exports with timestamps and formats

> 📸 _[Screenshot: Export history list]_

---

## Frequently Asked Questions

**Can I use the app without an account?**  
No — V3 requires an account to save and sync expenses.

**Is my data private?**  
Yes. Expenses are only visible to members of your workspace, or anyone you explicitly share a link with.

**What happens when a shared link expires?**  
The link becomes inactive and shows an "expired" message to anyone who tries to open it.

**Can I be in multiple workspaces?**  
Yes — use the workspace selector in the navbar to switch between them.

---

## Related Documentation

- [Technical Documentation (Developers)](../../docs/dev/feature-v3-backend.md)
