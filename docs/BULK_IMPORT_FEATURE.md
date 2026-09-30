# Proptii — Bulk Import & Assignment Feature
### Plain-English Product Specification

---

## What problem does this solve?

Right now, landlords can only add **one tenant** or **one property** at a time. If a landlord has 20 tenants on a spreadsheet from a previous system, they have to manually fill in the same form 20 times.

This feature lets landlords:
1. **Add many tenants at once** by uploading a spreadsheet
2. **Add many properties at once** by uploading a spreadsheet
3. **Assign multiple tenants to their properties** in one go after importing them

---

## The three things being built

### Thing 1 — Bulk Tenant Import
Upload a spreadsheet. All tenants get added in one click.

### Thing 2 — Bulk Property Import
Upload a spreadsheet. All properties get added in one click.

### Thing 3 — Bulk Assignment
After importing tenants (who have no property yet), connect them all to their properties from one screen.

---

## How it will look and feel

---

### THING 1 — Bulk Tenant Import

#### Step 0 — Choosing single or bulk

When a landlord clicks **+ Add Tenant** anywhere in the app, before anything else they see a simple two-option screen:

```
┌──────────────────────────────────────────────────────┐
│                                                      │
│   How are you adding tenants today?                  │
│                                                      │
│   ┌─────────────────┐     ┌──────────────────────┐   │
│   │                 │     │                      │   │
│   │   One tenant    │     │  Multiple tenants    │   │
│   │                 │     │  (upload a file)     │   │
│   │  Fill in a      │     │                      │   │
│   │  form step      │     │  Import from a       │   │
│   │  by step        │     │  spreadsheet         │   │
│   │                 │     │                      │   │
│   └─────────────────┘     └──────────────────────┘   │
│                                                      │
└──────────────────────────────────────────────────────┘
```

- Choosing **One tenant** opens the existing step-by-step form — nothing changes there
- Choosing **Multiple tenants** starts the bulk import flow below

---

#### Step 1 — Download the template and fill it in

The landlord is shown a screen like this:

```
┌──────────────────────────────────────────────────────┐
│                                                      │
│   Import Multiple Tenants                            │
│                                                      │
│   1. Download our template spreadsheet               │
│      [⬇ Download CSV Template]                       │
│                                                      │
│   2. Fill it in with your tenant details             │
│                                                      │
│   3. Upload it here:                                 │
│                                                      │
│   ┌──────────────────────────────────────────────┐   │
│   │                                              │   │
│   │       Drag and drop your file here           │   │
│   │       or click to browse                     │   │
│   │                                              │   │
│   │       Accepts .csv and .xlsx files           │   │
│   │                                              │   │
│   └──────────────────────────────────────────────┘   │
│                                                      │
└──────────────────────────────────────────────────────┘
```

The template spreadsheet they download looks like this when opened in Excel:

| name | email | phone | rentAmount | paymentFrequency | leaseStart | leaseEnd | firstPaymentDate | emergencyContactName | emergencyContactPhone | notes |
|------|-------|-------|------------|-----------------|------------|----------|-----------------|---------------------|----------------------|-------|
| James Okafor | james@email.com | +44 7911 123456 | 1800 | monthly | 2026-10-01 | 2027-10-01 | 2026-10-01 | Amara Okafor | +44 7922 987654 | Quiet professional |

**Important:** The property column is deliberately not included. Tenants can be imported without a property and assigned to one afterwards. This makes the import much simpler.

---

#### Step 2 — Proptii checks every row automatically

After the file is uploaded, Proptii reads every row and checks for mistakes **before** anything is saved. The landlord sees a table:

```
┌─────┬──────────────────┬─────────────────────────┬────────┬──────────────────────────────┐
│ Row │ Name             │ Email                   │ Rent   │ Status                       │
├─────┼──────────────────┼─────────────────────────┼────────┼──────────────────────────────┤
│  1  │ James Okafor     │ james@email.com          │ £1,800 │ ✅ Ready                     │
│  2  │ Sarah Chen       │ sarah@email.com          │ £2,200 │ ✅ Ready                     │
│  3  │                  │ notavalidemail           │        │ ❌ Name missing · Bad email  │
│  4  │ David Obi        │ david@email.com          │ £1,500 │ ✅ Ready                     │
│  5  │ Fatima Al-Hassan │ fatima@email.com         │ £1,900 │ ✅ Ready                     │
└─────┴──────────────────┴─────────────────────────┴────────┴──────────────────────────────┘

18 ready to import · 2 errors · 0 excluded
```

For any row with an error, the landlord can:
- **Fix it directly in the table** by clicking on the cell and typing the correct value
- **Exclude the row** by unticking it — that row will be skipped

Nothing is saved to Proptii yet at this point. This is just a preview.

---

#### Step 3 — Confirm before importing

A simple summary screen before anything happens:

```
┌──────────────────────────────────────────────────────┐
│                                                      │
│   Ready to import                                    │
│                                                      │
│   ✅  18 tenants will be created                     │
│   📋  All 18 will be unassigned (no property yet)   │
│   ❌  2 rows have errors and will be skipped         │
│                                                      │
│   You can assign tenants to properties               │
│   after importing from the Properties page.          │
│                                                      │
│             [Import 18 Tenants]                      │
│                                                      │
└──────────────────────────────────────────────────────┘
```

---

#### Step 4 — Results

After clicking Import, every row is processed and the landlord sees what happened:

```
┌─────┬──────────────────┬──────────────────────────────────────────┐
│ Row │ Name             │ Result                                   │
├─────┼──────────────────┼──────────────────────────────────────────┤
│  1  │ James Okafor     │ ✅ Added successfully                    │
│  2  │ Sarah Chen       │ ✅ Added successfully                    │
│  3  │ (skipped)        │ ⚠️  Skipped — had errors                 │
│  4  │ David Obi        │ ✅ Added successfully                    │
│  5  │ Fatima Al-Hassan │ ✅ Added successfully                    │
│ ... │ ...              │ ...                                      │
│ 21  │ Emma Walsh       │ ❌ Failed — email already exists         │
└─────┴──────────────────┴──────────────────────────────────────────┘

16 created · 1 failed · 2 skipped

[⬇ Download error report]     [Go to Clients]
```

- If any rows failed (e.g. that email already exists in the system), they are listed clearly
- The landlord can download a small spreadsheet of just the failed rows to fix and re-import
- All successfully created tenants immediately appear in the Clients tab

---

### THING 2 — Bulk Property Import

Exactly the same four-step flow as tenant import, but for properties. The choice card appears when clicking **+ Add Property**:

```
┌──────────────────────────────────────────────────────┐
│                                                      │
│   How are you adding properties today?               │
│                                                      │
│   ┌─────────────────┐     ┌──────────────────────┐   │
│   │   One property  │     │  Multiple properties  │   │
│   │   (fill in a    │     │  (upload a file)      │   │
│   │    form)        │     │                       │   │
│   └─────────────────┘     └──────────────────────┘   │
│                                                      │
└──────────────────────────────────────────────────────┘
```

The property template spreadsheet looks like this:

| address | type | bedrooms | bathrooms | rent | postcode | city | notes |
|---------|------|----------|-----------|------|----------|------|-------|
| 14 Well Street, London | flat | 2 | 1 | 1800 | E9 7PX | London | Near station |

Same steps: upload → check errors → confirm → see results.

---

### THING 3 — Bulk Assignment (connecting tenants to properties)

After a bulk tenant import, all those tenants exist in Proptii but have no property attached. The landlord now goes to the **Properties page** and clicks a new button:

**"Assign Tenants"** — with a badge showing how many tenants are currently unassigned, e.g. **"Assign Tenants (18)"**

This opens the assignment screen:

```
┌────────────────────────────────────────────────────────────────────────────┐
│                                                                            │
│  ASSIGN TENANTS TO PROPERTIES                    18 tenants unassigned    │
│                                                                            │
│  Search tenants: [_______________]                                         │
│                                                                            │
├──────────────────────────────────────────┬─────────────────────────────────┤
│ TENANT                                   │ ASSIGN TO PROPERTY              │
├──────────────────────────────────────────┼─────────────────────────────────┤
│ ☐  James Okafor                          │  [Choose a property ▼]          │
│    james@email.com                       │                                 │
├──────────────────────────────────────────┼─────────────────────────────────┤
│ ☐  Sarah Chen                            │  [Choose a property ▼]          │
│    sarah@email.com                       │                                 │
├──────────────────────────────────────────┼─────────────────────────────────┤
│ ☑  David Obi                         ──► │  14 Well Street, London ✅       │
│    david@email.com                       │  Rent £1,800/mo · Oct–Oct 2027  │
│                                          │  [Edit lease terms ▼]           │
├──────────────────────────────────────────┼─────────────────────────────────┤
│ ☑  Fatima Al-Hassan                  ──► │  22 Queensway, London ✅         │
│    fatima@email.com                      │  Rent £1,900/mo · Nov–Nov 2027  │
│                                          │  [Edit lease terms ▼]           │
└──────────────────────────────────────────┴─────────────────────────────────┘

☐  Apply same lease terms to all selected tenants

                              [Assign 2 Tenants]
```

**How it works:**

1. The landlord sees all their unassigned tenants on the left
2. On the right, they pick a property from a dropdown (only showing vacant properties)
3. When a property is selected, the rent is pre-filled from the property record
4. The lease dates default to next month for 1 year — but can be changed
5. Tick multiple tenants and use **"Apply same terms to all"** to set one rent, one set of dates, one frequency across all of them at once
6. Click **"Assign X Tenants"** when done

The result screen shows the same continue-and-report format — if any assignment failed, it's listed clearly with the reason, but everything else still goes through.

---

## What the landlord does NOT need to do

- **No coding or technical setup** — it's just uploading a spreadsheet
- **No specific spreadsheet software** — Excel, Google Sheets, Numbers, LibreOffice all work
- **No internet problems during import** — the file is checked on their computer first before anything is sent to Proptii
- **No starting over if something fails** — errors are listed per-row and the rest still imports fine
- **No need to assign properties during import** — tenants can live in Proptii without a property and be assigned later

---

## Common questions

**"What if I make a mistake in my spreadsheet?"**
Proptii checks every row before importing and shows you exactly what's wrong. You can fix mistakes directly in the preview table, or exclude any rows you're not sure about and add them manually later.

**"What if a tenant I'm importing already exists in Proptii?"**
That row will fail with the message "email already exists". The rest of the import continues. The failed rows are included in the error report you can download.

**"What if I close the browser halfway through?"**
The import happens in one step when you click the Import button. If it completes before you close, your tenants are saved. If the browser closes mid-import, check the Clients tab — successfully created tenants will be there and you can re-run the import for any that are missing.

**"How many tenants or properties can I import at once?"**
Up to 500 rows per file. For larger portfolios, split into multiple files.

**"Do I have to use the template?"**
No. As long as your spreadsheet has column headers that match (like "name", "email", "phone"), Proptii will recognise them. The template just makes it easy.

**"What if a property doesn't exist yet when I'm doing the assignment?"**
You can add properties separately (including in bulk) and then come back to the assignment screen. Alternatively, add the property manually first, then assign.

---

## What stays the same

- Adding a single tenant still works exactly as before — the new screen just asks first whether it's one or many
- Adding a single property still works exactly as before — same pattern
- All existing tenants and properties are unaffected
- The rest of the Proptii dashboard is unchanged

---

## Summary of what gets built

| Feature | What it does | Where it lives |
|---|---|---|
| Single/bulk choice for tenants | Asks landlord before the add form | Add Tenant screen |
| Single/bulk choice for properties | Asks landlord before the add form | Add Property screen |
| Bulk tenant import | Upload CSV → validate → confirm → import | Add Tenant (bulk path) |
| Bulk property import | Upload CSV → validate → confirm → import | Add Property (bulk path) |
| Assign tenants to properties | Two-column matching screen | Properties page |
| CSV tenant template | Downloadable example file | Shown during bulk import |
| CSV property template | Downloadable example file | Shown during bulk import |
| Error report download | Failed rows in a CSV file | Results screen |

---

*Document prepared for: Proptii Product Team*
*Feature: Bulk Import & Assignment*
*Status: Awaiting approval before build*
