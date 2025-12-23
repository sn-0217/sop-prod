import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Mail, Code2, Building2, Package, Calendar } from 'lucide-react';
import { API_BASE_URL } from '@/services/sopApi';

interface AboutDialogProps {
    open: boolean;
    onClose: () => void;
}

export function AboutDialog({ open, onClose }: AboutDialogProps) {
    const [versionData, setVersionData] = useState<{ version: string; release: string } | null>(null);

    useEffect(() => {
        if (open) {
            fetch(`${API_BASE_URL}/about`)
                .then(res => res.json())
                .then(data => setVersionData(data))
                .catch(err => console.error('Failed to fetch about info:', err));
        }
    }, [open]);

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold">SOP Management System</DialogTitle>
                    <DialogDescription>
                        Enterprise document management solution
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-6">
                    {/* About Section */}
                    <div className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                            A comprehensive platform designed for managing Standard Operating Procedures with advanced
                            version control, multi-level approval workflows, role-based access, and full compliance tracking
                            to streamline your organization's documentation processes.
                        </p>
                    </div>

                    {/* Developer Section */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Code2 className="w-4 h-4 text-blue-600" />
                            <span>Developed by</span>
                        </div>
                        <div className="pl-6 space-y-2">
                            <span className="font-semibold bg-gradient-to-r from-purple-600 via-pink-500 to-purple-400 bg-clip-text text-transparent">
                                𝓢𝓪𝓷𝓽𝓱𝓾 . 𝓢𝓝
                            </span>
                            <a
                                href="mailto:santosh.battula@knitwellgroup.com"
                                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-blue-600 transition-colors"
                            >
                                <Mail className="w-3.5 h-3.5" />
                                santosh.battula@knitwellgroup.com
                            </a>
                        </div>
                    </div>

                    {/* Company Section */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Building2 className="w-4 h-4 text-slate-600" />
                            <span>Company</span>
                        </div>
                        <div className="pl-6 space-y-2">
                            <p className="text-base font-semibold text-slate-700 dark:text-slate-300">Apptech | Knitwell Group</p>
                            <a
                                href="mailto:It-Applications-Support@Knitwellgroup.com"
                                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                            >
                                <Mail className="w-3.5 h-3.5" />
                                It-Applications-Support@Knitwellgroup.com
                            </a>
                        </div>
                    </div>

                    {/* Version Info */}
                    <div className="grid grid-cols-2 gap-4 pt-2">
                        <div className="flex items-start gap-3">
                            <Package className="w-4 h-4 text-blue-600 mt-0.5" />
                            <div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">Version</p>
                                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                    {versionData?.version || 'Loading...'}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <Calendar className="w-4 h-4 text-blue-600 mt-0.5" />
                            <div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">Released</p>
                                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                    {versionData?.release || 'Loading...'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                        <p className="text-xs text-center text-slate-500 dark:text-slate-400">
                            © {new Date().getFullYear()} Apptech | Knitwell Group. All rights reserved.
                        </p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}