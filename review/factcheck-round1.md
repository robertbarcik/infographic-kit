# Fact-check, round 1 (2026-09-29)

Independent read-only review of specs 02-06. No statement was found to be plainly wrong.
Findings below must be applied by the page authors. Replacement texts are suggestions;
keep within the text budgets.

Honest limits of this review: RFC 9110 and the Docker Desktop docs were fetched; most
other claims were checked against the reviewer's knowledge of the named RFCs and docs,
not re-fetched.

## 02 DNS — no WRONG, no MISLEADING

- APPLY. "`dig example.com` asks your resolver. The number after the name is the TTL."
  On a cached answer it is the remaining TTL and counts down.
  → "... The number after the name is the TTL left."
- APPLY. "`nslookup example.com` works on Windows, macOS and Linux."
  On many Linux distros it is not preinstalled.
  → "`nslookup example.com` also works on Windows and macOS."
- OPTIONAL. "A name with a CNAME holds no other records."
  → "A name with a CNAME can hold no other record types."

## 03 HTTPS / TLS — no WRONG, no MISLEADING

- APPLY. "`curl -v https://example.com` prints the TLS version and the certificate"
  It prints certificate details, not the whole certificate.
  → "... prints the TLS version and certificate details"
- OPTIONAL. "a key stolen later cannot open traffic recorded today." True for the normal
  (EC)DHE handshake; leave as is unless there is room for a qualifier.

## 04 Containers vs VMs — one weak MISLEADING

- APPLY (misleading). "stronger: a kernel bug stays inside one VM"
  VM isolation is stronger, not absolute (hypervisor escapes exist).
  → "stronger: a kernel bug usually stays in one VM"
- APPLY. "they cap how much CPU and memory each flat may use."
  Docker sets no limits by default.
  → "they can cap how much CPU and memory each flat gets."
- APPLY. "In the cloud, most containers run inside VMs too." "most" is unsourced.
  → "In the cloud, many containers run inside VMs too."
- NOTE. Page is scoped to Linux containers; keep wording "Linux containers" visible.

## 05 Git branches — no WRONG, no MISLEADING

- APPLY. Step "`git commit`": a bare `git commit` commits nothing unless changes are
  staged; beginners hit "nothing added to commit".
  → show `git add .` then `git commit` (or `git commit -a` with the caveat that it only
  covers tracked files).
- APPLY. "commit: a snapshot of all files + a link to its parent"
  → "... + a link to its parent(s)" (merge commits have two, shown later on the page).
- OPTIONAL. "drop the rest": deleting an unmerged branch needs `-D`.

## 06 REST API — one MISLEADING, one mild

- APPLY (misleading). "Answer: `201 Created` and the new order ..." after a plain curl
  command. Plain curl prints only the body, not the status line.
  → add `-i` to the command, or: "Prints the new order, e.g. {...}. Add `-i` to see
  `201 Created`."
- APPLY (mild). "PUT and DELETE are; POST is not" leaves out that GET is idempotent too.
  → "GET, PUT and DELETE are; POST is not: two POSTs, two soups."
- APPLY. "One real command": api.example.com is not a working API.
  → "One sample command" / "Sample answer:"
- OPTIONAL. `-X POST` is redundant with `-d`; dropping it saves space.
- OPTIONAL. The middle actor in the software row is "REST API: the menu of requests"
  while the restaurant row has the waiter there. Caption could be "the menu and the waiter".
