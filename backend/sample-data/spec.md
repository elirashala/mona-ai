# requests_2026-03.csv: columns and rules

The file is exported by the client's old system, exactly as their operations team receives it.

| Column | Meaning |
| --- | --- |
| `request_id` | The request's ID in the old system. It identifies a request. |
| `site` | One of: `Zürich-Oerlikon`, `Genève-Plainpalais`, `Basel-St. Johann`, `Lugano-Centro` |
| `reported_on` | The day the request was reported |
| `category` | One of: `Cleaning`, `HVAC`, `Electrical`, `Plumbing`, `Elevator`, `Locksmith`, `Gardening` |
| `description` | Free text from the caretaker or technician |
| `amount_chf` | The amount invoiced for the request, in Swiss francs |
| `technician` | Who did the work |

## Rules

- A row is valid when it has a known site, a known category, a real date and an amount greater than zero.
- An invalid row is not imported. It is listed with the reason, so the client can fix it in their system.
- The report for a month includes the requests reported in that month.
- Each request is counted once.
