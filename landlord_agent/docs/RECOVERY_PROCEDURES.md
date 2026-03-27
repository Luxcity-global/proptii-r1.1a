# Recovery (Hotfix) Procedures

Guidelines for handling build failures, deployment issues, and rolling back slot swaps in the Landlord Agent module.

## 1. Local Build Failures

If `npm run build` fails:
- Check `tsc_errors.txt` for any new TypeScript regressions.
- Ensure all dependencies are installed: `npm install`.
- Clear Vite cache: `rm -rf node_modules/.vite`.
- Verify environment variables: Ensure `env.example` matches your `.env` file.

## 2. Failed Deployment Slot Swap

If `scripts/swap-slots.sh` fails:
- **Abort & Revert**: If the swap hung or returned an error, the production slot may still be pointing to the old version.
- **Manual Rollback**: If the new version is live but buggy:
    ```bash
    az webapp deployment slot swap --name <app-name> --resource-group <resource-group> --slot staging --target-slot production
    ```
    This will swap the slots back, restoring the previous production version to live.

## 3. Azure Authentication Issues

If deployment scripts fail with authentication errors:
- Re-authenticate: `az login`.
- Verify the active subscription: `az account set --subscription <subscription-id>`.
- Check MSAL configuration in `src/config/msal.ts`.

## 4. Performance Degradation

If the `performance-monitor.ts` logs (or telemetry) show a sudden spike in LCP or FID:
- Check recent changes for large image assets or heavy third-party scripts.
- Analyze the bundle using the visualizer report: `build/bundle-analysis.html`.
- Consider splitting large components using `React.lazy()` if a chunk exceeds the warning limit (1000KB).

## 5. Recovery of Data

In the event of a critical state failure:
- Locate the latest stable commit in the main branch.
- Reset to that commit and re-run the build pipeline.
- Verify through the staging slot BEFORE swapping to production.
