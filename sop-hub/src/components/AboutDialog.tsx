import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

interface AboutDialogProps {
    open: boolean;
    onClose: () => void;
}

export function AboutDialog({ open, onClose }: AboutDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold">About SOP Management</DialogTitle>
                    <DialogDescription className="text-base">
                        Document management system for SOPs
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Copyright Section */}
                    <div className="space-y-2">
                        <h3 className="text-sm font-semibold text-foreground">Copyright</h3>
                        <p className="text-sm text-muted-foreground">
                            © {new Date().getFullYear()} Apptech | Knitwell Group. All rights reserved.
                        </p>
                    </div>

                    {/* Developer Section */}
                    <div className="space-y-2">
                        <h3 className="text-sm font-semibold text-foreground">Developed By</h3>
                        <div className="flex items-center gap-2 text-sm">
                            <span className="text-muted-foreground">Crafted with</span>
                            <span className="text-red-500 animate-pulse inline-block">💜</span>
                            <span className="text-muted-foreground">by</span>
                            <span className="font-semibold bg-gradient-to-r from-purple-600 via-pink-500 to-purple-400 bg-clip-text text-transparent">
                                𝓢𝓪𝓷𝓽𝓱𝓾 . 𝓢𝓝
                            </span>
                        </div>
                    </div>

                    {/* Version Section */}
                    <div className="space-y-2">
                        <h3 className="text-sm font-semibold text-foreground">Version</h3>
                        <p className="text-sm text-muted-foreground">1.0.0</p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
