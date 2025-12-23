import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, Calendar, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WelcomeBannerProps {
    onUploadClick: () => void;
}

export function WelcomeBanner({ onUploadClick }: WelcomeBannerProps) {
    const [greeting, setGreeting] = useState('');
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const updateGreeting = () => {
            const hour = new Date().getHours();
            if (hour < 12) setGreeting('Good Morning');
            else if (hour < 18) setGreeting('Good Afternoon');
            else setGreeting('Good Evening');
        };

        updateGreeting();
        const timer = setInterval(() => {
            setCurrentTime(new Date());
            updateGreeting();
        }, 60000); // Update every minute

        return () => clearInterval(timer);
    }, []);

    const formattedDate = currentTime.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric'
    });

    return (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-background border border-border/50 p-8 shadow-sm">
            {/* Background Pattern */}
            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-secondary/10 rounded-full blur-2xl" />

            <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
                        <Calendar className="w-4 h-4" />
                        <span>{formattedDate}</span>
                    </div>
                    <h1 className="text-4xl font-bold tracking-tight text-foreground">
                        {greeting}, <span className="text-primary">Team</span>
                    </h1>
                    <p className="text-muted-foreground max-w-lg">
                        Welcome back to your SOP Management Dashboard. You have full access to manage, review, and approve documents.
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="hidden lg:flex flex-col items-end mr-4 border-r border-border pr-6">
                        <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">System Time</span>
                        <div className="flex items-center gap-2 text-xl font-mono font-medium text-foreground">
                            <Clock className="w-4 h-4 text-primary" />
                            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                    </div>
                    <Button
                        onClick={onUploadClick}
                        size="lg"
                        className="shadow-lg hover:shadow-primary/20 transition-all hover:scale-105"
                    >
                        <Upload className="mr-2 h-5 w-5" />
                        Quick Upload
                    </Button>
                </div>
            </div>
        </div>
    );
}
