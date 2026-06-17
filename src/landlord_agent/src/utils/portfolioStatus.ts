/** True when the user is signed in but has not added any properties yet. */
export function isNewPortfolioUser(
  properties: { length: number } | null | undefined,
): boolean {
  return (properties?.length ?? 0) === 0;
}
