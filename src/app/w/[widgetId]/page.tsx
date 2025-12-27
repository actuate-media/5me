import { Metadata } from 'next';
import { getWidgetPayload } from '@/services/widget.service';
import { WidgetRenderer } from './widget-renderer';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ widgetId: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { widgetId } = await params;
  
  return {
    title: 'Reviews Widget',
    robots: 'noindex, nofollow',
    other: {
      'X-Frame-Options': 'ALLOWALL',
    },
  };
}

export default async function WidgetPage({ params }: PageProps) {
  const { widgetId } = await params;
  
  const payload = await getWidgetPayload(widgetId);

  if (!payload) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <p className="text-gray-500">Widget not found or not published</p>
      </div>
    );
  }

  return <WidgetRenderer payload={payload} />;
}
