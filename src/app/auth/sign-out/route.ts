import { signOut } from '@workos-inc/authkit-nextjs';

export function GET(): ReturnType<typeof signOut> {
  return signOut();
}
