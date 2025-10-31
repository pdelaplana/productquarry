import type { Metadata } from 'next';
import { getSupabaseAdmin } from '@/lib/supabase/server';

type Props = {
  params: Promise<{ slug: string }>;
  children: React.ReactNode;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  try {
    // Fetch board data for SEO
    const supabaseAdmin = getSupabaseAdmin();
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

    // Type assertion to help TypeScript after the null check
    const boardData = board as { name: string; description: string | null };

    const title = `${boardData.name} | Feedback Board`;
    const description =
      boardData.description ||
      `Share your feedback, report bugs, and suggest improvements for ${boardData.name}. View and track the status of all submitted feedback.`;

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
