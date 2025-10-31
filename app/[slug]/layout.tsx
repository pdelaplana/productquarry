import type { Metadata } from 'next';
import { supabaseAdmin } from '@/lib/supabase/server';

type Props = {
  params: Promise<{ slug: string }>;
  children: React.ReactNode;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  try {
    // Fetch board data for SEO
    const { data: board } = await supabaseAdmin
      .from('boards')
      .select('name, description')
      .eq('slug', slug)
      .eq('is_public', true)
      .single();

    if (!board) {
      return {
        title: 'Board Not Found | ProductQuarry',
        description: "This feedback board doesn't exist or is not public.",
      };
    }

    const title = `${board.name} | Feedback Board`;
    const description =
      board.description ||
      `Share your feedback, report bugs, and suggest improvements for ${board.name}. View and track the status of all submitted feedback.`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: 'website',
        siteName: 'ProductQuarry',
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
      },
      robots: {
        index: true,
        follow: true,
      },
    };
  } catch (_error) {
    return {
      title: 'Feedback Board | ProductQuarry',
      description: 'Share your feedback and help us improve',
    };
  }
}

export default function SlugLayout({ children }: Props) {
  return <>{children}</>;
}
