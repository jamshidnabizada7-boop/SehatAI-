import { redirect } from 'next/navigation';
import { getServerSession } from '@/lib/auth';
import { OnboardingFlow } from '@/components/onboarding/onboarding-flow';

// Server wrapper: guard the onboarding flow behind authentication.
export const metadata = {
  title: 'Onboarding — SehatAI',
};

export default async function OnboardingPage() {
  const session = await getServerSession();
  if (!session?.user) {
    redirect('/auth/signin');
  }
  return <OnboardingFlow />;
}
