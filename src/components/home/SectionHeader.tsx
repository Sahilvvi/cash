import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { ReactNode } from "react";

interface SectionHeaderProps {
  title: string;
  viewAllLink?: string;
  viewAllText?: string;
  icon?: ReactNode;
}

const SectionHeader = ({ title, viewAllLink, viewAllText = "View All", icon }: SectionHeaderProps) => {
  return (
    <div className="flex items-center justify-between mb-6">
      <h2 className="text-xl md:text-2xl font-bold font-heading text-foreground flex items-center gap-2">
        {icon}
        {title}
      </h2>
      {viewAllLink && (
        <Link 
          to={viewAllLink} 
          className="text-primary hover:text-primary-hover font-medium text-sm flex items-center gap-1 transition-colors"
        >
          {viewAllText}
          <ChevronRight className="w-4 h-4" />
        </Link>
      )}
    </div>
  );
};

export default SectionHeader;
