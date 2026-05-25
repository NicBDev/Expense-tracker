import { Copy, Users, Database, RefreshCw, ShieldCheck } from "lucide-react";

const accounts = [
  { id: 1, name: "Test User 1", email: "testuser1@spendwise.dev", password: "Password1123!", expenses: 30, role: "Owner" },
  { id: 2, name: "Test User 2", email: "testuser2@spendwise.dev", password: "Password2123!", expenses: 25, role: "Owner" },
  { id: 3, name: "Test User 3", email: "testuser3@spendwise.dev", password: "Password3123!", expenses: 0, role: "Owner" },
  { id: 4, name: "Test User 4", email: "testuser4@spendwise.dev", password: "Password4123!", expenses: 0, role: "Owner" },
  { id: 5, name: "Test User 5", email: "testuser5@spendwise.dev", password: "Password5123!", expenses: 0, role: "Owner" },
];

const roleSetup = [
  { email: "testuser2@spendwise.dev", role: "member", description: "Can add/edit expenses and invite others" },
  { email: "testuser3@spendwise.dev", role: "viewer", description: "Read-only — cannot add or edit expenses" },
];

const reseedScript = `# 1. Re-register all 5 accounts
for i in 1 2 3 4 5; do
  curl -s -X POST http://localhost:3000/api/register \\
    -H "Content-Type: application/json" \\
    -d "{\\"name\\": \\"Test User $i\\", \\"email\\": \\"testuser${"\${i}"}@spendwise.dev\\", \\"password\\": \\"Password${"\${i}"}123!\\"}"
done

# 2. Re-seed expenses for users 1 and 2
node scripts/seed-test-data.mjs`;

export default function TestDataPage() {
  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-semibold mb-3">
          <ShieldCheck className="w-3.5 h-3.5" />
          Dev / Test Reference
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Test Accounts</h1>
        <p className="text-slate-500 text-sm mt-1">
          All test accounts for local development at{" "}
          <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs">http://localhost:3000</code>
        </p>
      </div>

      {/* Accounts table */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-4 h-4 text-indigo-600" />
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Accounts</h2>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">#</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Name</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Email</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Password</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Expenses</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {accounts.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 text-slate-400 font-mono text-xs">{a.id}</td>
                  <td className="px-4 py-3 font-medium text-slate-800">{a.name}</td>
                  <td className="px-4 py-3">
                    <code className="bg-slate-100 px-2 py-0.5 rounded text-xs text-slate-700">{a.email}</code>
                  </td>
                  <td className="px-4 py-3">
                    <code className="bg-slate-100 px-2 py-0.5 rounded text-xs text-slate-700">{a.password}</code>
                  </td>
                  <td className="px-4 py-3">
                    {a.expenses > 0 ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-medium">
                        <Database className="w-3 h-3" />
                        {a.expenses} seeded
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">None</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Seeded data info */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Database className="w-4 h-4 text-indigo-600" />
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Seeded Data</h2>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-3">
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-xs text-slate-400 mb-1">Accounts with data</p>
              <p className="font-semibold text-slate-800">Users 1 &amp; 2</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-xs text-slate-400 mb-1">Total expenses</p>
              <p className="font-semibold text-slate-800">55 (30 + 25)</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-xs text-slate-400 mb-1">Date range</p>
              <p className="font-semibold text-slate-800">Last 90 days</p>
            </div>
          </div>
          <p className="text-xs text-slate-500">
            <strong>Categories:</strong> Food &amp; Dining, Transport, Shopping, Utilities, Entertainment, Health, Travel, Education
            &nbsp;·&nbsp;
            <strong>Amounts:</strong> $4.50 – $450.00 (randomised)
          </p>
        </div>
      </section>

      {/* Role testing */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <ShieldCheck className="w-4 h-4 text-indigo-600" />
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Suggested Role Setup</h2>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <p className="text-xs text-slate-500 mb-4">
            Log in as <code className="bg-slate-100 px-1.5 py-0.5 rounded">testuser1@spendwise.dev</code>, open the
            workspace switcher → <strong>Manage Members</strong>, then invite:
          </p>
          <div className="space-y-2">
            {roleSetup.map((r) => (
              <div key={r.email} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50">
                <code className="text-xs text-slate-700 bg-white border border-slate-200 px-2 py-1 rounded flex-shrink-0">
                  {r.email}
                </code>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  r.role === "member" ? "bg-indigo-50 text-indigo-700" : "bg-slate-100 text-slate-600"
                }`}>
                  {r.role}
                </span>
                <span className="text-xs text-slate-500">{r.description}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Re-seed instructions */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <RefreshCw className="w-4 h-4 text-indigo-600" />
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Re-seeding After DB Reset</h2>
        </div>
        <div className="bg-slate-900 rounded-xl p-5 overflow-x-auto">
          <pre className="text-xs text-slate-300 leading-relaxed whitespace-pre">{reseedScript}</pre>
        </div>
      </section>

      <p className="text-xs text-slate-400">Last updated: 2026-05-23 · <em>This page is for local dev use only — remove before deploying to production.</em></p>
    </div>
  );
}
