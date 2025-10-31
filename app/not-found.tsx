import { FileQuestion } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileQuestion className="h-5 w-5 text-muted-foreground" />
            <CardTitle>404 - Page Not Found</CardTitle>
          </div>
          <CardDescription>
            The page you're looking for doesn't exist or has been moved.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            If you believe this is an error, please contact support or try navigating from the home
            page.
          </p>
        </CardContent>
        <CardFooter>
          <Button asChild>
            <Link href="/">Return Home</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
