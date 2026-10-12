/** Where a shared-passport link should land once we know the signed-in role. */
export function passportDestination(roles: string[] | undefined, conversationId?: string) {
  const list = roles || [];
  const manager = list.includes('landlord') || list.includes('agent');
  const tenant = list.includes('tenant');
  if (tenant && !manager) {
    return { path: '/dashboard/tenant-referencing' };
  }
  return {
    path: '/landlord/messages',
    state: conversationId ? { conversationId } : undefined,
  };
}
