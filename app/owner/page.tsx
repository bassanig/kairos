import { env } from 'cloudflare:workers';
import { redirect } from 'next/navigation';
import { chatGPTSignInPath } from '../chatgpt-auth';
import OwnerLogin from './owner-login';

export default function OwnerPage() {
  if (env.AUTH_MODE !== 'standalone') redirect(chatGPTSignInPath('/'));
  return <OwnerLogin />;
}
