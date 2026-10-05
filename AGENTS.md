<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Enforce Free/Premium usage quotas in authenticated server functions through `daily_usage`; browser storage is display-only, because client-side counters are bypassable.
- Keep commerce entities separated as stores, products, and campaigns; legacy ad-network campaigns remain isolated because marketplace approvals and ownership require distinct records.
- Store authorization roles only in `user_roles` and verify them server-side through `has_role`, because profile fields and browser state are not security boundaries.
- Community search reads only public profile fields and unsuspended posts through the RLS-bound browser client; store search filters verified stores to preserve visibility boundaries.
