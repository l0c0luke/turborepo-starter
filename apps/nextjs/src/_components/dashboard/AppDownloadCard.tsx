import { Smartphone } from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "~/_components/ui/card";

export function AppDownloadCard() {
  return (
    <Card className="border-primary/20 w-full rounded-lg border shadow">
      <CardHeader>
        <CardTitle>Mobile App</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center gap-4 md:flex-row">
          <Smartphone className="text-muted-foreground h-10 w-10" />
          <div className="flex-1 text-center md:text-left">
            <p className="text-muted-foreground mb-2">
              A mobile app is also available for this project. Check the Expo
              app in the repository for the mobile experience.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
