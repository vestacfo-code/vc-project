import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";

interface NextPageLinkProps {
  href: string;
  title: string;
}

const NextPageLink = ({ href, title }: NextPageLinkProps) => {
  return (
    <div className="mt-16 border-t border-slate-200 pt-8">
      <Link 
        to={href}
        className="flex items-center justify-end gap-2 text-[#7ba3e8] hover:text-[#9dbcf0] transition-colors group"
      >
        <span className="text-sm font-medium">{title}</span>
        <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
      </Link>
    </div>
  );
};

export default NextPageLink;
