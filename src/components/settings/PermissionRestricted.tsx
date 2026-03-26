import { Lock } from 'lucide-react';

interface PermissionRestrictedProps {
  title: string;
  description: string;
  requiredRole?: string;
}

export const PermissionRestricted = ({ 
  title, 
  description,
  requiredRole = 'Owner'
}: PermissionRestrictedProps) => {
  return (
    <div className="flex-1 p-6 flex flex-col items-center justify-center text-center">
      <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-4">
        <Lock className="w-8 h-8 text-slate-500" />
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-sm text-slate-400 max-w-sm mb-4">{description}</p>
      <p className="text-xs text-slate-500">
        Only <span className="text-slate-400 font-medium">{requiredRole}</span> can access this section.
      </p>
    </div>
  );
};
