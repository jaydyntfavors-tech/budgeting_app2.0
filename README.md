# budgeting_app2.0
Budget Planner 2.0

React rewrite/upgrade of the original budgeting project.

Dependencies

npm install react react-dom lucide-react recharts

Import ./styles.css from App.jsx as shown.

What changed

Expanded default line items across Needs, Wants, Savings, and Debt.

Added a dashboard view with category mix and goal progress.

Added dedicated Goals tab.

Moved persistence from window.storage to browser localStorage.

Replaced the direct browser model request with /api/insights, so a Gemini/API key can remain server-side.

Replaced the dense inline-style presentation with reusable CSS classes and responsive components.

Kept the 50/30/20 framework and retirement projection.
